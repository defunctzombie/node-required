all:

generate:
	GENERATE=true mocha

test:
	npm test

cover:
	NODE_ENV=test cover run ./node_modules/mocha/bin/_mocha && cover report html
