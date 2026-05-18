#!/usr/bin/env bash
# Load Context stage
# Copy goal and load knowledge base into context
set -euo pipefail

mkdir -p .maestro/factory
mkdir -p specs/factory

# Copy goal (in real implementation, this would come from user input)
if [ -f specs/factory/vague-goal.md ]; then
  cp specs/factory/vague-goal.md .maestro/factory/goal.md
else
  echo "Example goal placeholder" > .maestro/factory/goal.md
fi

# Load knowledge (simulated - real version would call maestro CLI)
echo "Architecture principles, coding standards, workflow standards loaded" > .maestro/factory/context.md

echo "context-loaded"
