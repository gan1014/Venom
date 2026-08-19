export const MISSIONS = [
  {
    id: "M01",
    code: "01",
    title: "AI FOR CLIMATE RESILIENCE",
    short: "CLIMATE RESILIENCE",
    description:
      "Develop an AI-powered solution that helps communities, industries, or governments predict, adapt to, and recover from climate-related challenges through intelligent decision-making.",
  },
  {
    id: "M02",
    code: "02",
    title: "AI FOR FUTURE HEALTHCARE",
    short: "FUTURE HEALTHCARE",
    description:
      "Design an AI-powered solution that enables early disease detection, personalized healthcare, remote monitoring, and improved access to quality medical services.",
  },
  {
    id: "M03",
    code: "03",
    title: "AI FOR AUTONOMOUS SMART CITIES",
    short: "SMART CITIES",
    description:
      "Create an AI-driven solution that improves urban living through intelligent transportation, public safety, infrastructure, energy, or waste management.",
  },
  {
    id: "M04",
    code: "04",
    title: "AI FOR GLOBAL FOOD & WATER SECURITY",
    short: "FOOD & WATER",
    description:
      "Build an AI-powered solution that enhances food production, reduces waste, optimizes water resources, and strengthens sustainable supply chains.",
  },
  {
    id: "M05",
    code: "05",
    title: "AI FOR HUMAN-CENTERED DIGITAL SOCIETY",
    short: "DIGITAL SOCIETY",
    description:
      "Develop an AI solution that makes education, accessibility, digital safety, public services, or communication more inclusive, secure, and efficient.",
  },
  {
    id: "M06",
    code: "06",
    title: "OPEN INNOVATION",
    short: "OPEN INNOVATION",
    description:
      "Design and develop an AI-powered solution that addresses any real-world problem with innovation, scalability, and measurable impact.",
  },
] as const;

export type MissionId = (typeof MISSIONS)[number]["id"];
