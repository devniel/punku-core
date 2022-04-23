#!/bin/bash
#shopt -s expand_aliases
alias dokku='bash $HOME/.dokku/contrib/dokku_client.sh'
dokku --remote development config:set $(grep -v '^#' ./envs/production.env | xargs)