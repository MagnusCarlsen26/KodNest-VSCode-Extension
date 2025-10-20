const fs = require('fs');
const path = require('path');

/**
 * Encodes a string to base64.
 * @param {string} str
 * @returns {string}
 */
function encodeToBase64(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

// Read source code from temp.py and encode to base64
const sourceFilePath = path.join(__dirname, 'temp.py');
const sourceCode = fs.readFileSync(sourceFilePath, 'utf-8');
const base64SourceCode = encodeToBase64(sourceCode);

// Prepare the request body as a JS object for better formatting
const requestBody = {
  user_id: "d466e3e4-1f96-4802-b0cc-eaa5b01e928d",
  section_id: "c45d4f2b-5316-492b-bad2-773a88272624",
  type: "programming",
  response: {
    source_code: base64SourceCode,
    language_id: 62
  },
  question_id: "4d001ba5-e7b6-4bc2-bba1-fd094de7061e",
  time_taken: 4000,
  language: {
    id: "62",
    name: "Java (OpenJDK 13.0.1)"
  }
};

fetch("https://api.kodnest.in/assessment-service/api/v2/consumers/practices/0addc2ae-4696-4cb8-b5a3-0a6d4a39eced/submit", {
  method: "POST",
  headers: {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "access-control-allow-origin": "*",
    "authorization": "Bearer eyJraWQiOiJ4TjMyNm9IYWdPYVFJb0NEd2p4MmMydDNhSm9tTFd5MVpLUUZ0a01EVUtZPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkNDY2ZTNlNC0xZjk2LTQ4MDItYjBjYy1lYWE1YjAxZTkyOGQiLCJjb2duaXRvOmdyb3VwcyI6WyJrb2Qtc3R1ZGVudC1ncm91cCJdLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbVwvYXAtc291dGgtMV9VVGROSXBZTlkiLCJwaG9uZV9udW1iZXJfdmVyaWZpZWQiOnRydWUsImNvZ25pdG86dXNlcm5hbWUiOiJkNDY2ZTNlNC0xZjk2LTQ4MDItYjBjYy1lYWE1YjAxZTkyOGQiLCJvcmlnaW5fanRpIjoiZWU2ODg5NjEtYzcxYi00ZDNmLWJjOTUtZTlmMTVhODViMmVkIiwiYXVkIjoiN2JiaDUzams5bGZzOGJxamJtY21kcWRucnYiLCJldmVudF9pZCI6IjcxNDYzMzBkLWEzNTAtNDY5ZS04Y2IwLTA4ODAzOGU2MTEyZSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNzU3OTUwNDUyLCJuYW1lIjoiS0hVU0hBTCBTSU5ESEFWIiwicGhvbmVfbnVtYmVyIjoiKzkxOTMyODU3NjI1OCIsImV4cCI6MTc1OTMwNTY4OCwiaWF0IjoxNzU5MjE5Mjg4LCJqdGkiOiJlNDNiOTIxNS1lZDIzLTQwYTItODUzMC0wNDU0ZmRlNzlhNjkiLCJlbWFpbCI6ImtodXNoYWwuc2luZGhhdjI2QGdtYWlsLmNvbSJ9.fOH-ZRD7aJMHIpmEca4NmT_fHPwP_tiJobOAXlvJKzYPIJwLJrowl72V4_whYdcJMybzL5ygOpeY8OwCx0uMDlZhW5-9ns0U8kCYPPA3RhRaKCfWS7tds_PfpS2hUvitku1BB3WsRbtbcU9IWAvyEr4T2ie_qtgPeXoBmnmufSInEZlFePhG5AG81ZovCSQKWATL3iT29EiYySg8XptX-WFg-S3FcyCMNMEbeWZmNhdVJIJSkMJZw02K8H76tMjgAVpkLCqid4AHoT3zcGm5yE4vml5ELTmAW6QMSuo3BudJ0fw37V92wyuonYF0e57Cp5--XWetB6THgUnKo_AVXA",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "Referer": "https://app.kodnest.com/"
  },
  body: JSON.stringify(requestBody)
}).then(async (response) => console.log(await response.text()))