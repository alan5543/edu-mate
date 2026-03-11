import { log } from '../../utils/logger.js?v=0310-2';

// ==========================================
// Tool Tracker — Server & Device Tool Display
// ==========================================

let serverTools = [];
let deviceMcpTools = [];
let toolCallEvents = [];
let activityCount = 0;
let sysPerfCount = 0;
let _trackerInitialized = false;

// ==========================================
// Panel & Section Toggle Logic
// ==========================================

export function initToolTracker() {
    if (_trackerInitialized) return;
    _trackerInitialized = true;

    // Panel toggle
    const toggle = document.getElementById('debugPanelToggle');
    const content = document.getElementById('debugPanelContent');
    const arrow = document.getElementById('debugPanelArrow');
    if (toggle && content) {
        let isDragging = false;
        let startX, startY;
        let initialX, initialY;
        const panel = document.getElementById('debugPanel');

        toggle.addEventListener('mousedown', (e) => {
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            initialX = panel.offsetLeft;
            initialY = panel.offsetTop;

            toggle.style.cursor = 'grabbing';

            const onMouseMove = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    isDragging = true;
                }

                if (isDragging) {
                    panel.style.left = `${initialX + dx}px`;
                    panel.style.top = `${initialY + dy}px`;
                    panel.style.bottom = 'auto';
                    panel.style.right = 'auto';
                }
            };

            const onMouseUp = (upEvent) => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                toggle.style.cursor = 'grab';

                if (!isDragging) {
                    // Click logic
                    const collapsed = content.classList.toggle('collapsed');
                    if (arrow) arrow.textContent = collapsed ? '▶' : '▼';
                }
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    // Section toggles
    document.querySelectorAll('.debug-section-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const body = header.nextElementSibling;
            if (body) {
                const collapsed = body.classList.toggle('collapsed');
                const sectionArrow = header.querySelector('.debug-section-arrow');
                if (sectionArrow) sectionArrow.textContent = collapsed ? '▸' : '▾';
            }
        });
    });
}

// ==========================================
// Update total tool count badge
// ==========================================

function updateTotalBadge() {
    const el = document.getElementById('debugToolCount');
    if (el) {
        const total = serverTools.length + deviceMcpTools.length;
        el.textContent = total;
    }
}

// ==========================================
// Server Tools (from backend tool_list msg)
// ==========================================

const typeLabels = {
    'server_plugin': { emoji: '🔌', label: 'Server Plugin' },
    'server_mcp': { emoji: '🖥️', label: 'Server MCP' },
    'device_iot': { emoji: '📡', label: 'Device IoT' },
    'device_mcp': { emoji: '📱', label: 'Device MCP' },
    'mcp_endpoint': { emoji: '🌐', label: 'MCP Endpoint' },
    'sys_perf': { emoji: '⏱️', label: 'Sys Perf' },
    'unknown': { emoji: '❓', label: 'Unknown' },
};

const typeColors = {
    'server_plugin': '#5865f2',
    'server_mcp': '#57f287',
    'device_iot': '#fee75c',
    'device_mcp': '#eb459e',
    'mcp_endpoint': '#5865f2',
    'sys_perf': '#f5a623',
    'unknown': '#72767d',
};

export function renderToolList(tools) {
    serverTools = tools || [];
    const container = document.getElementById('serverToolsContainer');
    const badge = document.getElementById('serverToolsBadge');
    const status = document.getElementById('serverToolsStatus');

    // Filter out device_mcp tools — they're shown in the Device MCP section
    const filteredTools = serverTools.filter(t => t.type !== 'device_mcp');

    if (badge) badge.textContent = filteredTools.length;
    if (status) {
        status.textContent = filteredTools.length > 0 ? 'connected' : 'offline';
        status.className = `debug-section-status ${filteredTools.length > 0 ? 'status-ok' : 'status-off'}`;
    }
    if (!container) return;

    if (filteredTools.length === 0) {
        container.innerHTML = '<div class="tool-list-empty">Waiting for connection...</div>';
        updateTotalBadge();
        return;
    }

    // Group by type
    const grouped = {};
    filteredTools.forEach(tool => {
        const type = tool.type || 'unknown';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(tool);
    });

    let html = '';
    for (const [type, tools] of Object.entries(grouped)) {
        const info = typeLabels[type] || typeLabels['unknown'];
        const color = typeColors[type] || typeColors['unknown'];
        html += `<div class="tool-group">`;
        html += `<div class="tool-group-header">
                    <span class="type-dot" style="background:${color}"></span>
                    ${info.emoji} ${info.label}
                    <span class="tool-count">${tools.length}</span>
                 </div>`;
        tools.forEach(tool => {
            const desc = tool.description || '';
            const shortDesc = desc.length > 60 ? desc.substring(0, 60) + '...' : desc;
            html += `
                <div class="tool-item" id="tool-${tool.name}" data-type="${type}">
                    <div class="tool-item-row">
                        <span class="tool-status-dot idle"></span>
                        <span class="tool-item-name">${tool.name}</span>
                    </div>
                    ${shortDesc ? `<div class="tool-item-desc">${shortDesc}</div>` : ''}
                </div>`;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
    updateTotalBadge();
    log(`Loaded ${serverTools.length} server tools`, 'success');
}

// ==========================================
// Device MCP Tools (from client-side config)
// ==========================================

export function renderDeviceMcpTools(tools) {
    deviceMcpTools = tools || [];
    const container = document.getElementById('deviceMcpContainer');
    const badge = document.getElementById('deviceMcpBadge');
    if (badge) badge.textContent = deviceMcpTools.length;
    if (!container) return;

    if (deviceMcpTools.length === 0) {
        container.innerHTML = '<div class="tool-list-empty">No device MCP tools configured</div>';
        updateTotalBadge();
        return;
    }

    let html = '';
    deviceMcpTools.forEach(tool => {
        const desc = tool.description || '';
        const shortDesc = desc.length > 60 ? desc.substring(0, 60) + '...' : desc;
        const paramCount = tool.inputSchema?.properties ? Object.keys(tool.inputSchema.properties).length : 0;
        html += `
            <div class="tool-item device-tool" id="tool-${tool.name}" data-type="device_mcp">
                <div class="tool-item-row">
                    <span class="tool-status-dot idle"></span>
                    <span class="tool-item-name">${tool.name}</span>
                    <span class="tool-param-count">${paramCount}p</span>
                </div>
                ${shortDesc ? `<div class="tool-item-desc">${shortDesc}</div>` : ''}
            </div>`;
    });

    container.innerHTML = html;
    updateTotalBadge();
}

// ==========================================
// Tool Call Activity Feed
// ==========================================

export function addToolCallEvent(event) {
    const toolType = getToolType(event.name);
    const isSysPerf = toolType === 'sys_perf';

    if (isSysPerf) {
        sysPerfCount++;
        const badge = document.getElementById('sysPerfBadge');
        if (badge) badge.textContent = sysPerfCount;
    } else {
        toolCallEvents.unshift(event);
        if (toolCallEvents.length > 30) toolCallEvents.pop();
        activityCount++;

        const actBadge = document.getElementById('activityBadge');
        if (actBadge) actBadge.textContent = activityCount;

        // Highlight the tool in the list
        highlightActiveTool(event.name, event.result_action);
    }

    const logContainer = document.getElementById(isSysPerf ? 'sysPerfLog' : 'toolCallLog');

    if (!logContainer) return;

    // Remove empty placeholder
    const empty = logContainer.querySelector('.tool-list-empty');
    if (empty) empty.remove();

    const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Determine type → border color
    const color = typeColors[toolType] || '#5865f2';

    const actionClass = event.result_action === 'REQLLM' ? 'action-reqllm' :
        event.result_action === 'RESPONSE' ? 'action-response' :
            event.result_action === 'ERROR' ? 'action-error' : 'action-other';

    const argsStr = event.arguments ? JSON.stringify(event.arguments, null, 2) : '{}';
    const summaryStr = event.result_summary || '';
    const responseStr = event.result_response || '';
    const typeInfo = typeLabels[toolType] || typeLabels['unknown'];
    const eventId = `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Escape HTML to prevent XSS
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Build result sections
    let resultHtml = '';
    if (summaryStr) {
        resultHtml += `<div class="tool-call-detail-label">📥 Result → LLM (tool result):</div><pre class="tool-call-detail-pre">${esc(summaryStr)}</pre>`;
    }
    if (responseStr) {
        resultHtml += `<div class="tool-call-detail-label">💬 Direct Response:</div><pre class="tool-call-detail-pre">${esc(responseStr)}</pre>`;
    }

    let displayName = esc(event.name);
    if (isSysPerf && displayName.startsWith('sys_perf_')) {
        displayName = displayName.substring(9);
        if (event.arguments && event.arguments.duration_ms !== undefined) {
            const timeInSeconds = (event.arguments.duration_ms / 1000).toFixed(2);
            displayName += ` <span style="color:#f5a623; font-size:11px; margin-left: 6px; font-weight: normal;">⏱️ ${timeInSeconds}s</span>`;
        }
    }

    if (isSysPerf && event.arguments && event.arguments.content) {
        resultHtml += `<div class="tool-call-detail-label">📄 Content:</div><pre class="tool-call-detail-pre">${esc(event.arguments.content)}</pre>`;
    }

    const eventHtml = `
        <div class="tool-call-event" style="border-left-color:${color}">
            <div class="tool-call-header">
                <span class="tool-call-time">${now}</span>
                <span class="tool-call-type-badge" style="background:${color}20;color:${color}">${typeInfo.emoji} ${typeInfo.label}</span>
                <span class="tool-call-action ${actionClass}">${event.result_action || 'CALL'}</span>
            </div>
            <div class="tool-call-name">${displayName}</div>
            <div class="tool-call-detail-toggle" onclick="document.getElementById('${eventId}').classList.toggle('expanded')">
                ▸ Show Details
            </div>
            <div class="tool-call-details" id="${eventId}">
                <div class="tool-call-detail-label">📤 Arguments:</div>
                <pre class="tool-call-detail-pre">${esc(argsStr)}</pre>
                ${resultHtml}
            </div>
        </div>`;

    logContainer.insertAdjacentHTML('afterbegin', eventHtml);

    // Limit DOM entries
    while (logContainer.children.length > 20) {
        logContainer.removeChild(logContainer.lastChild);
    }

    log(`Tool call: ${event.name} → ${event.result_action}`, 'info');
}

/**
 * Mark a tool as calling (spinner) before execution
 */
export function markToolCalling(toolName) {
    const toolEl = document.getElementById(`tool-${toolName}`);
    if (!toolEl) return;
    const dot = toolEl.querySelector('.tool-status-dot');
    if (dot) {
        dot.classList.remove('idle', 'error');
        dot.classList.add('calling');
    }
    toolEl.classList.add('calling');
}

/**
 * Mark a tool as idle after execution
 */
export function markToolIdle(toolName) {
    const toolEl = document.getElementById(`tool-${toolName}`);
    if (!toolEl) return;
    const dot = toolEl.querySelector('.tool-status-dot');
    if (dot) {
        dot.classList.remove('calling', 'error');
        dot.classList.add('idle');
    }
    toolEl.classList.remove('calling');
}

// ==========================================
// Helpers
// ==========================================

function getToolType(toolName) {
    if (toolName && toolName.startsWith('sys_perf_')) return 'sys_perf';

    // Check server tools
    const st = serverTools.find(t => t.name === toolName);
    if (st) return st.type || 'unknown';
    // Check device MCP tools
    const dt = deviceMcpTools.find(t => t.name === toolName);
    if (dt) return 'device_mcp';
    return 'unknown';
}

function highlightActiveTool(toolName, action) {
    // Remove previous highlights
    document.querySelectorAll('.tool-item.active').forEach(el => el.classList.remove('active'));

    const toolEl = document.getElementById(`tool-${toolName}`);
    if (toolEl) {
        toolEl.classList.add('active');
        toolEl.classList.remove('calling');
        const dot = toolEl.querySelector('.tool-status-dot');
        if (dot) {
            dot.classList.remove('calling');
            dot.classList.add(action === 'ERROR' ? 'error' : 'idle');
        }
        toolEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Remove highlight after 3s
        setTimeout(() => {
            toolEl.classList.remove('active');
            if (dot) dot.classList.remove('error');
        }, 3000);
    }
}

/**
 * Clear tool list (on disconnect)
 */
export function clearToolList() {
    serverTools = [];
    activityCount = 0;
    const container = document.getElementById('serverToolsContainer');
    if (container) {
        container.innerHTML = '<div class="tool-list-empty">Waiting for connection...</div>';
    }
    const badge = document.getElementById('serverToolsBadge');
    if (badge) badge.textContent = '0';
    const status = document.getElementById('serverToolsStatus');
    if (status) {
        status.textContent = 'offline';
        status.className = 'debug-section-status status-off';
    }
    const logContainer = document.getElementById('toolCallLog');
    if (logContainer) {
        logContainer.innerHTML = '<div class="tool-list-empty">No activity yet</div>';
    }
    const actBadge = document.getElementById('activityBadge');
    if (actBadge) actBadge.textContent = '0';
    updateTotalBadge();
}
