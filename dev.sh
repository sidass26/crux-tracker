#!/bin/bash
cd "$(dirname "$0")"
exec /opt/homebrew/bin/node node_modules/next/dist/bin/next dev -p 3001
