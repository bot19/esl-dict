import { select } from "@inquirer/prompts";

async function confirm(prompt: string, data?: unknown) {
  if (data) console.log(data);

  const choices = [
    {
      name: "Yes",
      value: "yes",
    },
  ];

  choices.push({
    name: "No",
    value: "no",
  });

  const option = await select({
    message: prompt,
    choices,
  });

  return option !== "no";
}

export default confirm;
