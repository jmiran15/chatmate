export async function embed(input: string) {
  const url = "https://api.openai.com/v1/embeddings";
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REACT_APP_OPENAI}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input,
      model: "text-embedding-ada-002",
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}
