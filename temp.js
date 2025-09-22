async function nextSubmit(
    moduleId,
    topicId,
    subtopicId,
    courseId="ff74f2cf-c6cd-4b1a-b63a-4de3f7148203",
    userId='d466e3e4-1f96-4802-b0cc-eaa5b01e928d',
) {
    return await fetch(`https://api.kodnest.in/workflow-service/api/v3/workflow/${courseId}/${userId}/${moduleId}`, {
        "headers": {
            "authorization": "Bearer eyJraWQiOiJ4TjMyNm9IYWdPYVFJb0NEd2p4MmMydDNhSm9tTFd5MVpLUUZ0a01EVUtZPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkNDY2ZTNlNC0xZjk2LTQ4MDItYjBjYy1lYWE1YjAxZTkyOGQiLCJjb2duaXRvOmdyb3VwcyI6WyJrb2Qtc3R1ZGVudC1ncm91cCJdLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbVwvYXAtc291dGgtMV9VVGROSXBZTlkiLCJwaG9uZV9udW1iZXJfdmVyaWZpZWQiOnRydWUsImNvZ25pdG86dXNlcm5hbWUiOiJkNDY2ZTNlNC0xZjk2LTQ4MDItYjBjYy1lYWE1YjAxZTkyOGQiLCJvcmlnaW5fanRpIjoiZWU2ODg5NjEtYzcxYi00ZDNmLWJjOTUtZTlmMTVhODViMmVkIiwiYXVkIjoiN2JiaDUzams5bGZzOGJxamJtY21kcWRucnYiLCJldmVudF9pZCI6IjcxNDYzMzBkLWEzNTAtNDY5ZS04Y2IwLTA4ODAzOGU2MTEyZSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNzU3OTUwNDUyLCJuYW1lIjoiS0hVU0hBTCBTSU5ESEFWIiwicGhvbmVfbnVtYmVyIjoiKzkxOTMyODU3NjI1OCIsImV4cCI6MTc1ODYxNTg0MSwiaWF0IjoxNzU4NTI5NDQxLCJqdGkiOiJhMTI3NjI4NS04NjNlLTQ5MmMtYTEyYS01M2MyMWQ1ZDBhYzQiLCJlbWFpbCI6ImtodXNoYWwuc2luZGhhdjI2QGdtYWlsLmNvbSJ9.Uh6d--cshs-phGtPNmgO-H0NDCFfs6wgxeOjXSvvdVpV0doT6JF_NrjmhdAQRkTWuWVpnxg8aGjWZlyluKFEnbkxLcyqHJQ4Z50jGgYpqGJ3ANt0zVGCpf3bj86wNXxwm4ucklQFViPUDt5xSkz24Skat-iDovsBZBykxFs6Gdoiu3kpfVEnx28iQx66bddzjcOJQ8xxJ-q2Ko8rOD02LD1Oz1t8W_4j8RZdclsnLqBLzr3WwjojVzK6Xura07vyYuLQQ-hMIhQaSXjHlMuGEKC8jgICNPDioCWNguDDx_0z9kOKu6IMf64Vz0hVuYvkPGYCpt3Co0EdTsgABU4rbw",
        },
        "body": JSON.stringify({
            topic_id: topicId,
            subtopic_id: subtopicId,
            action: "next",
            submitted: true
        }),
        "method": "POST"
    }).then(response => response.json())
    .then(data => data)
    .catch(error => console.log(error));
}

async function main() {
    
    var moduleId="8253aec5-c50c-44fd-9dbd-5d51d25c4a46";
    var topicId="018b4552-5d08-4cce-a08f-212340ee148a";
    var subtopicId="464d922f-d8c6-42bf-ba30-95a31cdc75ff";

    let count = 0

    while(true) {
        const response = await nextSubmit(
            moduleId,
            topicId,
            subtopicId
        )
        count += 1
        console.log(response,count)
        moduleId=response.data.module_id;
        topicId=response.topicId;
        subtopicId=response.data.next_subtopic.id;
    }




}

main()