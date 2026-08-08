const getMissionDay = (mission) => {
  const day = Number(mission?.day);

  return Number.isInteger(day) ? day : null;
};

const isPassed = (mission) => {
  return mission?.passed === true;
};

const isSkipped = (mission) => {
  return mission?.skipped === true;
};

const getAttempts = (mission) => {
  const attempts = Number(mission?.attempts);

  return Number.isFinite(attempts) && attempts > 0 ? attempts : 1;
};

const uniqueNumbers = (values) => {
  return [...new Set(values.filter(Number.isInteger))];
};

const calculateDifficulty = ({
  strongDays,
  weakDays,
  repeatedAttemptDays,
  skippedDays,
}) => {
  if (weakDays.length > 0 || skippedDays.length > 0) {
    return "foundational";
  }

  if (repeatedAttemptDays.length > strongDays.length / 2) {
    return "intermediate";
  }

  return "intermediate";
};

export const buildCandidateIntelligence = (candidate) => {
  const missions = Array.isArray(candidate?.missions)
    ? candidate.missions
    : [];

  const completedDays = uniqueNumbers(
    missions
      .filter(isPassed)
      .map(getMissionDay),
  );

  const skippedDays = uniqueNumbers(
    missions
      .filter(isSkipped)
      .map(getMissionDay),
  );

  const weakDays = uniqueNumbers(
    missions
      .filter((mission) => mission?.passed === false)
      .map(getMissionDay),
  );

  const repeatedAttemptDays = uniqueNumbers(
    missions
      .filter((mission) => getAttempts(mission) >= 3)
      .map(getMissionDay),
  );

  const strongDays = uniqueNumbers(
    missions
      .filter(
        (mission) =>
          isPassed(mission) && getAttempts(mission) <= 2,
      )
      .map(getMissionDay),
  );

  const priorityDays = uniqueNumbers([
    ...skippedDays,
    ...weakDays,
    ...repeatedAttemptDays,
  ]);

  const recommendedDifficulty = calculateDifficulty({
    strongDays,
    weakDays,
    repeatedAttemptDays,
    skippedDays,
  });

  return {
    candidate: {
      id: candidate?.member?.id || null,
      name: candidate?.member?.name || null,
      jobRole: candidate?.member?.jobRole || null,
      yearsExperience: candidate?.member?.yearsExperience || null,
    },

    learningSignals: {
      completedDays,
      strongDays,
      weakDays,
      skippedDays,
      repeatedAttemptDays,
      priorityDays,
      recommendedDifficulty,
    },

    statistics: {
      totalMissions: missions.length,
      completedMissions: completedDays.length,
      skippedMissions: skippedDays.length,
      weakMissions: weakDays.length,
      repeatedAttemptMissions: repeatedAttemptDays.length,
    },

    interviewStrategy: {
      startWithDifficulty: recommendedDifficulty,

      prioritizeWeakAreas: priorityDays.length > 0,

      useFollowUpsWhen:
        repeatedAttemptDays.length > 0 ||
        weakDays.length > 0,

      avoidAssumingMastery:
        repeatedAttemptDays.length > 0,
    },
  };
};