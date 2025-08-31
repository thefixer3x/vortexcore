import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
const nixieKey = Deno.env.get('nixieai_secret_key');
const perplexityKey = Deno.env.get('sooner_perp_ai_key'); // Updated to use the sooner perp ai key
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { child_id, request_type, data } = await req.json();
    if (!child_id) {
      throw new Error("Missing child_id parameter");
    }
    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    // Fetch child's conversations data
    const { data: childConversations, error: conversationsError } = await supabaseClient.from('conversations').select('*').eq('user_id', child_id).order('created_at', {
      ascending: false
    }).limit(20);
    if (conversationsError) {
      throw new Error(`Error fetching child conversations: ${conversationsError.message}`);
    }
    // Fetch child's activities data including quizzes, lessons, etc.
    const { data: childActivities, error: activitiesError } = await supabaseClient.from('activities').select('*').eq('user_id', child_id).order('created_at', {
      ascending: false
    }).limit(50);
    if (activitiesError && activitiesError.code !== 'PGRST116') {
      throw new Error(`Error fetching child activities: ${activitiesError.message}`);
    }
    // Fetch child's stats (achievements, streaks, etc.)
    const { data: childStats, error: statsError } = await supabaseClient.from('user_stats').select('*').eq('user_id', child_id).single();
    if (statsError && statsError.code !== 'PGRST116') {
      throw new Error(`Error fetching child stats: ${statsError.message}`);
    }
    // Fetch child profile data (for demographics)
    const { data: childProfile, error: profileError } = await supabaseClient.from('profiles').select('*').eq('id', child_id).single();
    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error(`Error fetching child profile: ${profileError.message}`);
    }
    // Compile the dashboard data according to the ParentDashboardData interface
    const dashboardData = {
      studentId: child_id,
      engagement: {
        sessions: childActivities?.length || 0,
        totalMinutes: calculateTotalMinutes(childActivities || []),
        lastActive: getLastActiveTimestamp(childActivities, childConversations)
      },
      performance: {
        quizzesTaken: countQuizzes(childActivities || []),
        avgScore: calculateAverageScore(childActivities || []),
        strengths: identifyStrengths(childActivities || [], childStats || {}),
        improvementAreas: identifyImprovementAreas(childActivities || [], childStats || {})
      },
      feedback: {
        aiFeedback: generateAIFeedback(childActivities || [], childStats || {}),
        childComments: extractChildComments(childConversations || []),
        parentComments: []
      },
      chatSummary: summarizeChats(childConversations || [])
    };
    // Add demographics if available
    if (childProfile) {
      dashboardData.demographics = {
        age: childProfile.age || 0,
        grade: childProfile.grade || '',
        language: childProfile.language || 'English'
      };
    }
    // Prepare context based on request type
    let systemPrompt = "";
    let userPrompt = "";
    switch(request_type){
      case "dashboard_data":
        // Return the compiled dashboard data directly
        return new Response(JSON.stringify({
          data: dashboardData
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      case "weekly_summary":
        systemPrompt = `You are an educational analytics assistant for parents. Your task is to analyze a child's learning activity and provide a concise, insightful weekly summary. Focus on patterns, progress, and suggestions for parents to support learning at home.`;
        userPrompt = `Please create a weekly summary of my child's learning activity. Here's their dashboard data: ${JSON.stringify(dashboardData)}. Highlight strengths, areas for growth, and 2-3 specific activities I can do with my child to support their learning journey.`;
        break;
      case "topic_recommendation":
        systemPrompt = `You are an educational advisor for parents. Based on a child's learning patterns and interests, suggest appropriate learning topics and activities that would be engaging and educational.`;
        userPrompt = `Based on my child's recent activity: ${JSON.stringify(dashboardData)}, please suggest 3-4 topics or activities that would be engaging and help them build on their current interests and knowledge. For each suggestion, include a brief explanation of why it's appropriate and how it connects to their current learning path.`;
        break;
      case "question_answer":
        if (!data?.question) {
          throw new Error("Missing question in data parameter");
        }
        systemPrompt = `You are a helpful parental advisor for educational AI platforms. You answer parents' questions about their child's learning, digital literacy, and how to support their educational journey. Provide evidence-based, practical advice.`;
        userPrompt = `Based on this child's learning data: ${JSON.stringify(dashboardData)}, ${data.question}`;
        break;
      default:
        throw new Error(`Unsupported request_type: ${request_type}`);
    }
    // Use Perplexity as the primary service for parent dashboard
    if (perplexityKey) {
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.2,
          max_tokens: 800,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });
      if (perplexityResponse.ok) {
        const data = await perplexityResponse.json();
        const aiResponse = data.choices[0].message.content;
        return new Response(JSON.stringify({
          response: aiResponse
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else {
        console.log("Perplexity request failed, falling back to OpenAI");
      }
    }
    // Fallback to OpenAI if available
    if (nixieKey) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nixieKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.2,
          max_tokens: 800,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });
      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        const aiResponse = data.choices[0].message.content;
        return new Response(JSON.stringify({
          response: aiResponse
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else {
        const errorData = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }
    }
    // If we get here, both providers failed or weren't configured
    throw new Error("No AI provider keys available");
  } catch (error) {
    console.error("Error in parent-dashboard function:", error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
// Helper functions for calculating dashboard metrics
function calculateTotalMinutes(activities) {
  return activities.reduce((total, activity)=>{
    // Get duration from activity metadata or estimate based on content size
    const duration = activity?.details?.duration_minutes || (activity?.details?.content_length ? Math.ceil(activity.details.content_length / 200) : 5);
    return total + duration;
  }, 0);
}
function getLastActiveTimestamp(activities, conversations) {
  const timestamps = [
    ...(activities || []).map((a)=>a.created_at),
    ...(conversations || []).map((c)=>c.updated_at)
  ].filter(Boolean);
  if (timestamps.length === 0) {
    return new Date().toISOString(); // Default to current time if no activities
  }
  return new Date(Math.max(...timestamps.map((ts)=>new Date(ts).getTime()))).toISOString();
}
function countQuizzes(activities) {
  return activities.filter((activity)=>activity?.activity_type === 'assessment' || activity?.activity_type === 'quiz').length;
}
function calculateAverageScore(activities) {
  const quizzes = activities.filter((activity)=>activity?.activity_type === 'assessment' || activity?.activity_type === 'quiz');
  if (quizzes.length === 0) return 0;
  const totalScore = quizzes.reduce((sum, quiz)=>{
    return sum + (quiz.score || 0);
  }, 0);
  return +(totalScore / quizzes.length).toFixed(1);
}
function identifyStrengths(activities, stats) {
  // Identify topics where the child has high scores or engagement
  const topicScores = new Map();
  activities.forEach((activity)=>{
    const topic = activity?.details?.topic || activity?.details?.subject;
    if (topic && activity.score) {
      if (!topicScores.has(topic)) {
        topicScores.set(topic, {
          score: 0,
          count: 0
        });
      }
      const current = topicScores.get(topic);
      current.score += activity.score;
      current.count += 1;
    }
  });
  // Calculate average score per topic and find strengths
  const strengths = [];
  topicScores.forEach((data, topic)=>{
    const avgScore = data.score / data.count;
    if (avgScore >= 80) {
      strengths.push(topic);
    }
  });
  // If we couldn't identify strengths from activities, use some default math topics
  if (strengths.length === 0) {
    return [
      'Math Fundamentals',
      'Problem Solving',
      'Logic'
    ];
  }
  return strengths.slice(0, 3); // Return top 3 strengths
}
function identifyImprovementAreas(activities, stats) {
  // Similar to strengths but looking for topics with lower scores
  const topicScores = new Map();
  activities.forEach((activity)=>{
    const topic = activity?.details?.topic || activity?.details?.subject;
    if (topic && activity.score) {
      if (!topicScores.has(topic)) {
        topicScores.set(topic, {
          score: 0,
          count: 0
        });
      }
      const current = topicScores.get(topic);
      current.score += activity.score;
      current.count += 1;
    }
  });
  // Calculate average score per topic and find improvement areas
  const improvementAreas = [];
  topicScores.forEach((data, topic)=>{
    const avgScore = data.score / data.count;
    if (avgScore < 70) {
      improvementAreas.push(topic);
    }
  });
  // If we couldn't identify improvement areas from activities, use some default areas
  if (improvementAreas.length === 0) {
    return [
      'Advanced Math',
      'Data Interpretation',
      'Complex Problem Solving'
    ];
  }
  return improvementAreas.slice(0, 3); // Return top 3 improvement areas
}
function generateAIFeedback(activities, stats) {
  // Generate positive feedback based on activities and stats
  const feedback = [];
  // Add feedback about engagement
  if (activities.length > 10) {
    feedback.push("Your child is showing great engagement with the platform!");
  } else if (activities.length > 0) {
    feedback.push("Your child is starting to engage with the learning platform.");
  } else {
    feedback.push("Encourage your child to explore more learning activities on the platform.");
  }
  // Add feedback about achievements if available
  if (stats?.achievements?.length > 0) {
    feedback.push(`Earned ${stats.achievements.length} achievements, showing dedication to learning.`);
  }
  // Add feedback about consistency/streaks if available
  if (stats?.streak > 3) {
    feedback.push(`Maintained a learning streak of ${stats.streak} days, showing consistency!`);
  }
  // Ensure we have at least 3 feedback items
  if (feedback.length < 3) {
    feedback.push("Regular practice leads to mastery. Encourage daily learning sessions.");
    feedback.push("Celebrate small wins to build confidence in problem-solving abilities.");
  }
  return feedback;
}
function extractChildComments(conversations) {
  // Extract meaningful comments from child's conversations
  const comments = [];
  conversations.forEach((convo)=>{
    const metadata = convo?.metadata;
    if (metadata?.sentiment === 'positive') {
      comments.push(metadata.highlight || "I enjoyed this lesson!");
    } else if (metadata?.comment) {
      comments.push(metadata.comment);
    }
  });
  // Add default comments if we couldn't extract any
  if (comments.length === 0) {
    return [
      "I like learning math with Nixie!",
      "The games make learning fun.",
      "I want to learn more about coding."
    ];
  }
  return comments.slice(0, 5); // Return up to 5 comments
}
function summarizeChats(conversations) {
  // Create a summary of recent chat interactions
  const summary = [];
  conversations.slice(0, 5).forEach((convo)=>{
    // Simplified summary of each conversation
    summary.push({
      role: "user",
      content: convo.title || "Learning session",
      timestamp: convo.created_at
    });
    if (convo.context) {
      summary.push({
        role: "assistant",
        content: `Helped with ${convo.context}`,
        timestamp: convo.updated_at
      });
    }
  });
  // Add a default summary if we couldn't extract any
  if (summary.length === 0) {
    const now = new Date().toISOString();
    return [
      {
        role: "user",
        content: "Introduction to math concepts",
        timestamp: now
      },
      {
        role: "assistant",
        content: "Explained addition and subtraction with examples",
        timestamp: now
      }
    ];
  }
  return summary;
}
