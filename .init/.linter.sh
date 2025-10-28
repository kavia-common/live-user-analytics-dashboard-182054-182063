#!/bin/bash
cd /home/kavia/workspace/code-generation/live-user-analytics-dashboard-182054-182063/frontend_dashboard
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

