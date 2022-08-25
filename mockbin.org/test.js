import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const req = {
    method: 'POST',
    url: 'https://dummyjson.com/users/add',
    body: {
      firstName: 'Super!',
      lastName: 'Ovi',
      age: 30
    },
    params: {
      headers: { 'Content-Type': 'application/json' }
    },
  };
  const responses = http.batch([req]);
  // httpbin.test.k6.io should return our POST data in the response body, so
  // we check the third response object to see that the POST worked.
  check(responses, {
    'form data OK': (res) => JSON.parse(res.body)['firstName'] == 'Super!',
  });
}
