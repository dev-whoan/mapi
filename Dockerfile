FROM node:16.16.0

RUN apt-get update && apt-get install -y \
	curl \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .
RUN npm install -g npm-check-updates \
	ncu -u \
	npm install \
	npm install express \
	npm install babel-cli \
	npm install babel-preset \
	npm install babel-preset-env \
	npm install body-parser \
        npm install mariadb \
	npm install path \
	npm install url \
	npm install fs

RUN npm ci --only=production

COPY . /app

EXPOSE 3000
CMD [ "babel-node", "starter.js" ]
