// State
let currentRunId = null;
let currentGateId = null;
let pollInterval = null;
let startTime = null;

// DOM Elements
const inputView = document.getElementById('input-view');
const progressView = document.getElementById('progress-view');
const goalForm = document.getElementById('goal-form');
const goalInput = document.getElementById('goal-input');
const charCount = document.getElementById('char-count');
const runIdEl = document.getElementById('run-id');
const elapsedTimeEl = document.getElementById('elapsed-time');
const progressBar = document.getElementById('progress-bar');
const stagesEl = document.querySelector('.stages');
const artifactLinksEl = document.getElementById('artifact-links');
const gateModal = document.getElementById('gate-modal');
const gateTitleEl = document.getElementById('gate-title');
const gateWhatHappensEl = document.getElementById('gate-what-happens');
const gateFilesEl = document.getElementById('gate-files');
const gateCostEl = document.getElementById('gate-cost');
const gateApproveBtn = document.getElementById('gate-approve');
const gateRejectBtn = document.getElementById('gate-reject');

// Icon mapping
const statusIcons = {
  pending: '⏳',
  in_progress: '⚙️',
  complete: '✅',
  failed: '❌'
};

// ─── Helpers ─────

function updateCharCount() {
  const length = goalInput.value.length;
  charCount.textContent = length;

  if (length < 3) {
    charCount.style.color = '#e74c3c';
  } else if (length > 4500) {
    charCount.style.color = '#f39c12';
  } else {
    charCount.style.color = '#7f8c8d';
  }
}

function formatDuration(seconds) {
  if (seconds == null) return 'N/A';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

function updateElapsedTime() {
  if (startTime == null) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  elapsedTimeEl.textContent = formatDuration(elapsed);
}

// ─── API Calls ─────

async function submitGoal(goal) {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit goal');
  }

  return response.json();
}

async function getStatus(runId) {
  const response = await fetch(`/api/status/${runId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get status');
  }

  return response.json();
}

async function approveGate(runId, gateId, approved, reason) {
  const response = await fetch(`/api/approve-gate/${runId}/${gateId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved, rejectionReason: reason })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve gate');
  }

  return response.json();
}

async function retryStage(runId, stageId) {
  const response = await fetch(`/api/retry/${runId}/${stageId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to retry stage');
  }

  return response.json();
}

// ─── UI Rendering ─────

function renderStages(stages) {
  stagesEl.innerHTML = '';

  stages.forEach(stage => {
    const stageEl = document.createElement('div');
    stageEl.className = 'stage';

    const icon = document.createElement('div');
    icon.className = `stage-icon status-${stage.status}`;
    icon.textContent = statusIcons[stage.status];

    const info = document.createElement('div');
    info.className = 'stage-info';

    const name = document.createElement('div');
    name.className = 'stage-name';
    name.textContent = `${stage.stageName} (${stage.persona})`;

    const meta = document.createElement('div');
    meta.className = 'stage-meta';
    meta.textContent = `Status: ${stage.status}`;
    if (stage.durationSeconds != null) {
      meta.textContent += ` • Duration: ${formatDuration(stage.durationSeconds)}`;
    }
    if (stage.retryCount > 0) {
      meta.textContent += ` • Retry: ${stage.retryCount}/3`;
    }

    info.appendChild(name);
    info.appendChild(meta);

    stageEl.appendChild(icon);
    stageEl.appendChild(info);

    // Show output if available
    if (stage.output && stage.status === 'complete') {
      const output = document.createElement('div');
      output.className = 'stage-output';
      output.textContent = stage.output.substring(0, 500);
      if (stage.output.length > 500) {
        output.textContent += '...';
      }
      info.appendChild(output);
    }

    // Show error if failed
    if (stage.error) {
      const error = document.createElement('div');
      error.className = 'stage-error';

      const message = document.createElement('div');
      message.className = 'error-message';
      message.textContent = `❌ ${stage.error.persona}: ${stage.error.cause}`;

      const action = document.createElement('div');
      action.className = 'error-action';
      action.textContent = stage.error.recommendedAction;

      error.appendChild(message);
      error.appendChild(action);

      if (stage.error.retryable && stage.retryCount < 3) {
        const retryBtn = document.createElement('button');
        retryBtn.className = 'btn btn-secondary btn-retry';
        retryBtn.textContent = 'Retry';
        retryBtn.onclick = () => handleRetry(stage.stageId);
        error.appendChild(retryBtn);
      }

      info.appendChild(error);
    }

    stagesEl.appendChild(stageEl);
  });
}

function renderArtifacts(artifacts) {
  if (artifacts.length === 0) {
    artifactLinksEl.innerHTML = '<p class="muted">Artifacts will appear as stages complete...</p>';
    return;
  }

  artifactLinksEl.innerHTML = '';

  artifacts.forEach(artifact => {
    const link = document.createElement('a');
    link.className = 'artifact-link';
    link.href = `/api/artifact/${currentRunId}/${artifact.type}`;
    link.target = '_blank';

    const icon = document.createElement('span');
    icon.className = 'artifact-icon';
    icon.textContent = getArtifactIcon(artifact.type);

    const text = document.createElement('span');
    text.textContent = `${artifact.type.toUpperCase()} - ${artifact.path}`;

    link.appendChild(icon);
    link.appendChild(text);
    artifactLinksEl.appendChild(link);
  });
}

function getArtifactIcon(type) {
  const icons = {
    spec: '📄',
    code: '💻',
    review: '🔍',
    ci_log: '🔧'
  };
  return icons[type] || '📁';
}

function showGateModal(gate) {
  currentGateId = gate.gateId;

  gateTitleEl.textContent = `${gate.gateType} Gate: ${gate.stageName}`;
  gateWhatHappensEl.textContent = gate.context.whatWillHappen;

  gateFilesEl.innerHTML = '';
  gate.context.whatFilesWillChange.forEach(file => {
    const li = document.createElement('li');
    li.textContent = file;
    gateFilesEl.appendChild(li);
  });

  if (gate.context.costExposure) {
    gateCostEl.textContent = `Cost exposure: ${gate.context.costExposure}`;
    gateCostEl.style.display = 'block';
  } else {
    gateCostEl.style.display = 'none';
  }

  gateModal.classList.remove('hidden');
}

function hideGateModal() {
  gateModal.classList.add('hidden');
  currentGateId = null;
}

function updateProgress(state) {
  const total = state.stages.length;
  const completed = state.stages.filter(s => s.status === 'complete').length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  progressBar.style.width = `${percentage}%`;

  renderStages(state.stages);
  renderArtifacts(state.artifacts);

  // Check for pending gates
  const pendingGate = state.humanGates.find(g => g.status === 'pending');
  if (pendingGate) {
    showGateModal(pendingGate);
  }

  // Stop polling if workflow complete or failed
  if (state.status === 'complete' || state.status === 'failed') {
    stopPolling();
  }
}

// ─── Event Handlers ─────

async function handleSubmit(e) {
  e.preventDefault();

  const goal = goalInput.value.trim();

  if (goal.length < 3 || goal.length > 5000) {
    alert('Goal must be between 3 and 5000 characters');
    return;
  }

  try {
    const result = await submitGoal(goal);
    currentRunId = result.data.runId;
    runIdEl.textContent = currentRunId;

    startTime = Date.now();
    inputView.classList.add('hidden');
    progressView.classList.remove('hidden');

    startPolling();
  } catch (error) {
    alert(`Failed to submit goal: ${error.message}`);
  }
}

async function handleGateApprove() {
  if (!currentGateId) return;

  try {
    await approveGate(currentRunId, currentGateId, true);
    hideGateModal();
  } catch (error) {
    alert(`Failed to approve gate: ${error.message}`);
  }
}

async function handleGateReject() {
  if (!currentGateId) return;

  const reason = prompt('Rejection reason (optional):');

  try {
    await approveGate(currentRunId, currentGateId, false, reason);
    hideGateModal();
  } catch (error) {
    alert(`Failed to reject gate: ${error.message}`);
  }
}

async function handleRetry(stageId) {
  try {
    await retryStage(currentRunId, stageId);
  } catch (error) {
    alert(`Failed to retry stage: ${error.message}`);
  }
}

// ─── Polling ─────

function startPolling() {
  if (pollInterval) return;

  pollInterval = setInterval(async () => {
    try {
      const result = await getStatus(currentRunId);
      updateProgress(result.data);
      updateElapsedTime();
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 3000);

  // Initial fetch
  getStatus(currentRunId)
    .then(result => updateProgress(result.data))
    .catch(error => console.error('Initial fetch error:', error));
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// ─── Initialization ─────

goalInput.addEventListener('input', updateCharCount);
goalForm.addEventListener('submit', handleSubmit);
gateApproveBtn.addEventListener('click', handleGateApprove);
gateRejectBtn.addEventListener('click', handleGateReject);

updateCharCount();
