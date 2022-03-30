/* eslint-disable no-console */
import http from 'k6/http';
import { check, group } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const dataConfig = JSON.parse(open('./env.json'));
const testData = JSON.parse(open('./data_test.json'));

const { rpsTestcase, rpsTestcase100 } = require('./testcases.js');

/* General Custom Metric */
export let httpNot200 = new Counter('http_not_200');
export let iterationSuccess = new Counter('iterations_success');
export let iterationFailed = new Counter('iterations_failed');
export let errorRate = new Rate('iterations_error_rate');

/* Global Variable */
const baseURL = dataConfig.url;
const testcases = rpsTestcase; //ubah testcasenya
const path = {
	getUserDetails: '/public/v2/posts'
};
const metricTags = {
	getUserDetails: { api: path.getUserDetails }
};

/* Test Scenario Configuration */
export let options = {
    
	// Concurrency
	scenarios: {
		GorestCoIn: {
			executor: 'constant-arrival-rate',
			rate: testcases.rate,
			timeUnit: '1s',
			duration: testcases.duration, //10s atau bisa 3m (menit)
			preAllocatedVUs: testcases.preAllocatedVUs, //seperlima dari rate 10->2, 20->4, 25->5, 30->6, 50->10, 100->20, 200->40
			maxVUs: testcases.maxVUs, //sama dengan rate
			exec: 'GorestCoIn'
		}
	},

	// Acceptance criteria
	thresholds: {      
		[`http_req_duration${JSON.stringify(metricTags.getUserDetails)}`]: ['max<8000'],
		[`http_not_200${JSON.stringify(metricTags.getUserDetails)}`]: ['count<1'],
		'iterations_error_rate': [ { threshold: 'rate<0.1', abortOnFail: true, delayAbortEval: '1m' } ]
	}
};

/* Custom Function */
function genData() {
	var jsonId = testData;
    var random = jsonId.id[Math.floor(Math.random() * jsonId.id.length)];

	const idDetail = random;
  
	return {
		idDetail
	};
}

/* Test Scenario */
export function GorestCoIn() {

	group(`Gorest.co.in - Get User Details | ${testcases.description}`, function() {

		//local-variable
		const data = genData();
		
		//header
		const params = { 
			headers: { 
				'Content-Type': 'application/json'
			}, 
			tags: metricTags.getUserDetails 
		};

		//http-request
		const getUserDetails = http.get(`${baseURL}${path.getUserDetails}/${data.idDetail}`, params);
		
		//parsing-response
		let parsedRes;

		try {
			parsedRes = JSON.parse(getUserDetails.body);
		} catch (e) {
			if (parsedRes == undefined) parsedRes = { status: '' };
			console.error(`${path.getUserDetails} | Response is not a JSON`);
			console.error(JSON.stringify(getUserDetails.body));
		}
		
		//validate-response
		let checkRes = check(getUserDetails, {
			[path.getUserDetails]: getUserDetails.status === 200
		});
    
		if (!checkRes) {
			if (getUserDetails.status != 200) {
				httpNot200.add(1, metricTags.getUserDetails);
				console.error(`${path.getUserDetails} | HTTP Response: ${getUserDetails.status}`);
			}
			iterationFailed.add(1);
			errorRate.add(true);
			console.error(`${path.getUserDetails} | ${JSON.stringify(parsedRes)}`);
		} else {
			iterationSuccess.add(1);
			errorRate.add(false);
		}
	});
}