#!/usr/bin/env bash
set -e
VERSION=$1
aws --profile=nuts ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 343749756837.dkr.ecr.ap-southeast-1.amazonaws.com
docker build -t 343749756837.dkr.ecr.ap-southeast-1.amazonaws.com/taiga/api:$VERSION .
docker push 343749756837.dkr.ecr.ap-southeast-1.amazonaws.com/taiga/api:$VERSION
