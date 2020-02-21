# SAMPLE: https://gist.github.com/mpneuried/0594963ad38e68917ef189b4e6a269db
# import config.
# You can change the default config with `make cnf="config_special.env" build`
cnf ?= .env
include $(cnf)
export $(shell sed 's/=.*//' $(cnf))

# Local
ifeq ($(ENVIRONMENT),local)
SERVICE_NAME := $(STAGING_SERVICE_NAME)
TAG_VERSION := $(STAGING_TAG_VERSION)
DOCKERFILE := local.api.Dockerfile
ECR_DOCKER_REPO := $(STAGING_ECR_DOCKER_REPO)
endif
# Staging
ifeq ($(ENVIRONMENT),staging)
SERVICE_NAME := $(STAGING_SERVICE_NAME)
TAG_VERSION := $(STAGING_TAG_VERSION)
DOCKERFILE := staging.api.Dockerfile
ECR_DOCKER_REPO := $(STAGING_ECR_DOCKER_REPO)
endif

ifeq ($(MAKEFILE_TARGET),consumer)
SERVICE_NAME := $(STAGING_CONSUMER_SERVICE_NAME)
TAG_VERSION := $(STAGING_CONSUMER_TAG_VERSION)
DOCKERFILE := staging.consumer.Dockerfile
ECR_DOCKER_REPO := $(STAGING_ECR_DOCKER_REPO)
endif

build: ## Build the container
	docker build -f $(DOCKERFILE) -t $(SERVICE_NAME):$(TAG_VERSION) .

build-nc: ## Build the container without caching
	docker build --no-cache -f $(DOCKERFILE) -t $(SERVICE_NAME):$(TAG_VERSION) .

run:
	docker-compose -f docker-compose.yml up -d

stop:
	docker-compose -f docker-compose.yml down

update:
	docker-compose build $(SERVICE_NAME)
	docker-compose up --no-deps -d $(SERVICE_NAME)

publish: repo-login publish-version ## Publish the `{version}` ans `latest` tagged containers to ECR

publish-version: tag-version ## publish the `{version}` taged container to ECR
	@echo 'publish $(TAG_VERSION) to $(ECR_DOCKER_REPO)'
	docker push $(ECR_DOCKER_REPO)/$(SERVICE_NAME):$(TAG_VERSION)

tag-version: ## Generate container `{version}` tag
	@echo 'create image tagged $(TAG_VERSION)'
	docker tag $(SERVICE_NAME):$(TAG_VERSION) $(ECR_DOCKER_REPO)/$(SERVICE_NAME):$(TAG_VERSION)

# login to AWS-ECR
repo-login: ## Auto login to AWS-ECR unsing aws-cli
	@eval $$(aws ecr get-login --no-include-email --region ap-south-1)

version:
	@echo 'Version: $(TAG_VERSION)'
	@echo 'Service name: $(SERVICE_NAME)'
	@echo 'Dockerfile for building the image: $(DOCKERFILE)'
	@echo 'Docker client version: $(shell docker version --format {{.Client.Version}})'
	@echo 'Docker server version: $(shell docker version --format {{.Server.Version}})'
	@echo 'ECR repository: $(ECR_DOCKER_REPO)'

ecr-list-images:
	@aws ecr list-images --repository-name $(SERVICE_NAME)

clean:
	docker volume prune --force
	docker image prune --force
