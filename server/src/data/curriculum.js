import curriculumData from "./curriculum.json" with { type: "json" };

const validateCurriculum = (data) => {
  if (!data || typeof data !== "object") {
    throw new Error("Curriculum data must be an object.");
  }

  if (!Array.isArray(data.days)) {
    throw new Error("Curriculum must contain a days array.");
  }

  if (data.days.length !== 31) {
    throw new Error(
      `Curriculum integrity error: expected 31 days, received ${data.days.length}.`,
    );
  }

  const dayNumbers = data.days.map((item) => item.day);

  const uniqueDays = new Set(dayNumbers);

  if (uniqueDays.size !== 31) {
    throw new Error(
      "Curriculum integrity error: duplicate day numbers detected.",
    );
  }

  for (let day = 1; day <= 31; day += 1) {
    if (!uniqueDays.has(day)) {
      throw new Error(
        `Curriculum integrity error: missing day ${day}.`,
      );
    }
  }

  for (const item of data.days) {
    if (
      !Number.isInteger(item.day) ||
      !item.title ||
      !item.type ||
      !Array.isArray(item.tools) ||
      !Array.isArray(item.objectives)
    ) {
      throw new Error(
        `Curriculum integrity error: invalid structure for day ${item.day}.`,
      );
    }
  }

  return data;
};

const validatedCurriculum = validateCurriculum(curriculumData);

export const curriculum = validatedCurriculum.days;

export const curriculumModules =
  validatedCurriculum.modules;

export const getCurriculumByDay = (day) => {
  const numericDay = Number(day);

  if (!Number.isInteger(numericDay)) {
    return null;
  }

  return (
    curriculum.find(
      (item) => item.day === numericDay,
    ) || null
  );
};

export const getCurriculumByDays = (days) => {
  if (!Array.isArray(days)) {
    return [];
  }

  const requestedDays = new Set(
    days
      .map(Number)
      .filter(Number.isInteger),
  );

  return curriculum.filter((item) =>
    requestedDays.has(item.day),
  );
};

export const getCurriculumTitles = () => {
  return curriculum.map((item) => ({
    day: item.day,
    title: item.title,
    type: item.type,
  }));
};

export const getCurriculumSize = () => {
  return curriculum.length;
};