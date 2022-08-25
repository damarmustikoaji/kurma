/* eslint-disable no-console */
import http from 'k6/http';
import { check, group } from 'k6';
import { Counter, Rate } from 'k6/metrics';

/* Data Test */
const dataConfig = JSON.parse(open('./data/config.json'));
const dataPayload = JSON.parse(open('./data/data_post.json'));

/* Custom Metrics */
export let httpNot201 = new Counter('http_not_201');
export let iterationSuccess = new Counter('iterations_success');
export let iterationFailed = new Counter('iterations_failed');
export let errorRate = new Rate('iterations_error_rate');

/* Global Variable */
const url = dataConfig.url;
const path = {
    endpoint: dataConfig.path.post
};
const metricTags = {
    endpoint: {
        api: path.endpoint
    }
};

/* Test Configuration */
const user = dataConfig.user;
//mengalokasikan jumlah VU sebelum memulai tes
const startUser = dataConfig.startUser; //seperlima dari rate 10->2, 20->4, 25->5, 30->6, 50->10, 100->20, 200->40
const duration = dataConfig.duration; //'1s' or '1m'

export let options = {
    // Concurrent
    scenarios: {
        Mockbin: {
            executor: 'constant-arrival-rate',
            // It should start 30 iterations per `timeUnit`. Note that iterations starting points
            // will be evenly spread across the `timeUnit` period.
            rate: user,
            // It should start `rate` iterations per second
            timeUnit: '1s',
            // Our test should last 30 seconds in total
            duration: duration,
            // It should preallocate 2 VUs before starting the test
            preAllocatedVUs: startUser,
            // It is allowed to spin up to 50 maximum VUs to sustain the defined
            // constant arrival rate.
            maxVUs: user,
            exec: 'Mockbin'
        }
    },

    // Acceptance Criteria
    thresholds: {
        [`http_req_duration${JSON.stringify(metricTags.endpoint)}`]: ['max<30000'],
        [`http_not_201${JSON.stringify(metricTags.endpoint)}`]: ['count<1'],
        'iterations_error_rate': [{
            threshold: 'rate<0.1',
            abortOnFail: true
        }]
    },

    // Trend Report
    summaryTrendStats: ['avg', 'p(95)', 'p(99)', 'max']
};

/* Test Scenario */
export function Mockbin() {
    group(`Mockbin - Post Endpoints ${url}`, function() {
        // CURL
        const curl = {
            method: 'POST',
            url: url + path.endpoint,
            body: dataPayload.postUserAdd,
            params: {
                headers: {
                    'Content-Type': 'application/json'
                },
            },
        };
        // HTTP-Request (batch)
        const response = http.batch([curl]);

        // Print responses
        // console.log(JSON.stringify(response[0]));

        // Validate-Response Format
        let parsedResponse;

        try {
            parsedResponse = JSON.parse(response[0].body);
        } catch (e) {
            if (parsedResponse == undefined) parsedResponse = {
                status: ''
            };
            console.error(`${path.endpoint} | Response is not a JSON`);
            console.error(JSON.stringify(response[0].body));
        }

        // Validate-Response Status Code (headers or body)
        const checkRes = check(response[0], {
            [path.endpoint]: parsedResponse.status === '00' && response[0].status === 201
        });

        // Adding on metrics
        if (!checkRes) {
            if (response[0] != 201) {
                httpNot201.add(1, metricTags.endpoint);
                console.error(`${path.endpoint} | HTTP Response: ${response[0].status}`);
            }
            iterationFailed.add(1);
            errorRate.add(true);
            console.error(`${path.endpoint} | ${JSON.stringify(parsedResponse)}`);
        } else {
            iterationSuccess.add(1);
            errorRate.add(false);
        }
    });
}