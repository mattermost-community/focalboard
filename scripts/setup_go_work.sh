#!/bin/bash

if [[ ! -f "go.work" ]] ;
then
    echo "Creating a go.work file"

    txt="go 1.18\n\n"
    txt="${txt}use ./mattermost-plugin\n"
    txt="${txt}use ./server\n"
    txt="${txt}use ../mattermost-server\n"
    
    printf "$txt" > "go.work"
fi 





