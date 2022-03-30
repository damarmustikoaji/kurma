const rpsTestcase = {
	description: 'RPS',
    rate: 10,
    duration: '10s', //10s (detik) atau bisa 3m (menit)
    preAllocatedVUs: 2, //seperlima dari rate 10->2, 20->4, 25->5, 30->6, 50->10, 100->20, 200->40
    maxVUs: 10, //sama dengan rate
};

const rpsTestcase100 = {
	description: 'RPS',
    rate: 100,
    duration: '3m', //10s (detik) atau bisa 3m (menit)
    preAllocatedVUs: 20, //seperlima dari rate 10->2, 20->4, 25->5, 30->6, 50->10, 100->20, 200->40
    maxVUs: 100, //sama dengan rate
};

module.exports = {
	rpsTestcase,
    rpsTestcase100
};