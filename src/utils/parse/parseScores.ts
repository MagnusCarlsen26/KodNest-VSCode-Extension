export type Score = {
    status: string;
    problemId: string;
}

export async function parseScores(
    response: any
): Promise<Score[]> {

    const scoresData = (await response.json()).data.items;

    if (scoresData.length === 0) {
        throw new Error('No scores found');
    }

    return scoresData.map((score: any) => ({
        status: score.status,
        problemId: score.id,
    }));

}