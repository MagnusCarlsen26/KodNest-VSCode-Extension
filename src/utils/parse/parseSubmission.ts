export async function parseSubmission(
    response: any
): Promise<string[]> {

    const data = await response.json();

    return data.data.items.map((submission: any) => submission.id);

}