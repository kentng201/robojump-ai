import { RobotPersona } from "../types";

function getRandomBrightColor(): string {
  while (true) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    // Relative luminance (WCAG)
    const luminance =
      0.2126 * (r / 255) +
      0.7152 * (g / 255) +
      0.0722 * (b / 255);

    // Require brightness high enough for dark backgrounds
    if (luminance > 0.55) {
      return (
        "#" +
        r.toString(16).padStart(2, "0") +
        g.toString(16).padStart(2, "0") +
        b.toString(16).padStart(2, "0")
      );
    }
  }
}

export const generateRobotPersona = async (): Promise<RobotPersona> => {
  const names = [
    "JumpUnit-7",
    "BounceBot",
    "AeroSpark",
    "Climber-X",
    "TurboHopper",
    "SpringFrame",
    "SkyPatcher",
  ];

  const missions = [
    "Reach impossible heights.",
    "Defy gravity with style.",
    "Collect data from the upper stratosphere.",
    "Test maximum jump efficiency.",
    "Scout vertical terrain.",
    "Locate high-altitude energy pockets.",
    "Map aerial platform routes.",
  ];

  return {
    name: names[Math.floor(Math.random() * names.length)],
    mission: missions[Math.floor(Math.random() * missions.length)],
    color: getRandomBrightColor(),
  };
};

export const generateGameOverMessage = async (
  score: number,
  robotName: string
): Promise<string> => {
  const messages = [
    `${robotName} faceplanted at ${score}. Gravity: 1, robot: 0.`,
    `${robotName} bailed out at ${score}. At least the fall looked stylish.`,
    `Well, ${robotName} achieved ${score} before spectacularly failing upward.`,
    `${robotName} soared to ${score}… then remembered robots can’t fly.`,
    `At ${score}, ${robotName} decided the ground seemed inviting.`,
    `${robotName} hit ${score} and then hit everything else.`,
    `${robotName} reached ${score} before embracing terminal velocity.`,
    `${robotName} got to ${score}. The landing? Less impressive.`,
    `${robotName} peaked at ${score} and promptly un-peaked.`,
    `${robotName} jumped to ${score}. The fall was free DLC.`,
    `${robotName} managed ${score} before rage-quitting gravity.`,
    `${robotName} reached ${score} but forgot where the floor was.`,
    `${robotName} climbed to ${score} then rebooted mid-air.`,
    `${robotName} hit ${score} before gravity reclaimed its property.`,
    `${robotName} achieved ${score} and an equally impressive crash.`,
    `${robotName} reached ${score}; gravity sent its regards.`,
    `${robotName} climbed to ${score} then took the express elevator down.`,
    `${robotName} hit ${score}—and every platform on the way down.`,
    `${robotName} achieved ${score}, proving robots can fall brilliantly.`,
    `${robotName} soared to ${score} before making a dramatic exit.`,
    `${robotName} reached ${score} but gravity demanded tribute.`,
    `${robotName} got to ${score} and then got very acquainted with the ground.`,
    `${robotName} climbed to ${score} before the universe said “nope.”`,
    `${robotName} reached ${score} and then experienced immediate regret.`,
    `${robotName} made it to ${score} before taking an ill-timed nap mid-air.`,
    `${robotName} hit ${score}, then hit everything else shortly after.`,
    `${robotName} reached ${score}—not bad for a robot with no fear of heights.`,
    `${robotName} scored ${score} before gravity reminded it who’s boss.`,
    `${robotName} climbed to ${score} and fell like it meant it.`,
    `${robotName} reached ${score}. The descent was… enthusiastic.`,
    `${robotName} managed ${score}; the ground managed the rest.`,
    `${robotName} soared to ${score}, then plummeted in style.`,
    `${robotName} got to ${score} before experiencing unexpected downward mobility.`,
    `${robotName} hit ${score} but missed the next platform entirely.`,
    `${robotName} reached ${score}, proving optimism doesn’t prevent falling.`,
    `${robotName} climbed to ${score} before physics took revenge.`,
    `${robotName} reached ${score}, then discovered the floor the hard way.`,
    `${robotName} made it to ${score}—the landing was less impressive.`,
    `${robotName} soared to ${score} and immediately regretted it.`,
    `${robotName} achieved ${score}; now achieving “broken.”`,
    `${robotName} climbed to ${score} but forgot how to jump after that.`,
    `${robotName} hit ${score} before gracefully eating dirt.`,
    `${robotName} reached ${score}—gravity cheered.`,
    `${robotName} soared to ${score}; momentum disagreed shortly after.`,
    `${robotName} got to ${score} and then got humbled by physics.`,
    `${robotName} climbed to ${score}. The fall was the real achievement.`,
    `${robotName} reached ${score}; the descent was less voluntary.`,
    `${robotName} hit ${score} and then hit rock bottom—literally.`,
    `${robotName} climbed to ${score} until the next jump said “no.”`,
    `${robotName} reached ${score}. Shame the ground reached back.`,
  ];

  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
};