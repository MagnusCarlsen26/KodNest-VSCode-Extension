import { Verdict } from "../../types";
import { convertFromBase64 } from "../convertToFromBase64";

export async function parseSubmissionByExecutionIdResponse(
    response: any
): Promise<Verdict[]> {

    const verdictsData = (await response.json()).data.response;
    const verdicts = verdictsData.test_cases;


    if (verdicts.length === 0) {
        throw new Error('No verdicts found');
    }
    
    const parsedVerdicts: Verdict[] = [];
    for (const verdict of verdicts) {

        parsedVerdicts.push({
            expectedOutput: convertFromBase64(verdict.expected_output),
            compileOutput: convertFromBase64(verdict.compile_output),
            status: verdict.status.description,
            stdin: convertFromBase64(verdict.stdin),
            stdout: convertFromBase64(verdict.stdout),
            stderr: convertFromBase64(verdict.stderr),
            time: verdict.time,
        });

    }

    return parsedVerdicts;
}   