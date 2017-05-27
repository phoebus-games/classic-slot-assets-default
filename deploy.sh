#!/bin/sh
set -eux

ARTIFACT=$(curl -f -u $CIRCLE_TOKEN: https://circleci.com/api/v1.1/project/github/phoebus-games/$CIRCLE_PROJECT_REPONAME/$CIRCLE_BUILD_NUM/artifacts|jq -r '.[] | .url')
echo {\"build_parameters\": {\"ARTIFACT\": \"$ARTIFACT\"}} > post
curl -fv -u $CIRCLE_TOKEN: -d @post -H 'Content-Type: application/json' https://circleci.com/api/v1.1/project/github/phoebus-games/deploy-assets/tree/master
