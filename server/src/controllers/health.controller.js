export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "healthy",
      service: "ABTalks AI Interviewer API",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
};