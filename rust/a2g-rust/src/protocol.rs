use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

// =============================================================================
// A2G MESSAGE TYPES (Agent → Governance)
// =============================================================================

/// A2G_INTENT: Agent requests permission to perform an action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct A2gIntent {
    pub jsonrpc: String,
    pub method: String, // "a2g/intent"
    pub params: IntentParams,
    pub id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntentParams {
    pub agent_did: String,
    pub intent_id: String,
    pub tool: String,
    pub arguments: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<IntentContext>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntentContext {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_intent: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reasoning: Option<String>,
    /// Signature context required for identity validation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub signature: Option<super::did::Signature>,
}

impl A2gIntent {
    pub fn new(agent_did: &str, tool: &str, arguments: serde_json::Value) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            method: "a2g/intent".to_string(),
            params: IntentParams {
                agent_did: agent_did.to_string(),
                intent_id: Uuid::new_v4().to_string(),
                tool: tool.to_string(),
                arguments,
                context: None,
            },
            id: Uuid::new_v4().to_string(),
        }
    }

    pub fn with_context(mut self, reasoning: &str) -> Self {
        let mut ctx = self.params.context.unwrap_or(IntentContext {
            session_id: None,
            parent_intent: None,
            reasoning: None,
            signature: None,
        });
        ctx.reasoning = Some(reasoning.to_string());
        self.params.context = Some(ctx);
        self
    }
}

/// A2G_REPORT: Agent reports execution outcome
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct A2gReport {
    pub jsonrpc: String,
    pub method: String, // "a2g/report"
    pub params: ReportParams,
    pub id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportParams {
    pub agent_did: String,
    pub intent_id: String,
    pub status: ExecutionStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metrics: Option<ExecutionMetrics>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ExecutionStatus {
    Success,
    Failure,
    Timeout,
    Aborted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionMetrics {
    pub duration_ms: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub memory_used_mb: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cpu_percent: Option<f32>,
}

impl A2gReport {
    pub fn success(agent_did: &str, intent_id: &str, result: serde_json::Value, duration_ms: u64) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            method: "a2g/report".to_string(),
            params: ReportParams {
                agent_did: agent_did.to_string(),
                intent_id: intent_id.to_string(),
                status: ExecutionStatus::Success,
                result: Some(result),
                metrics: Some(ExecutionMetrics {
                    duration_ms,
                    memory_used_mb: None,
                    cpu_percent: None,
                }),
                error: None,
            },
            id: Uuid::new_v4().to_string(),
        }
    }

    pub fn failure(agent_did: &str, intent_id: &str, error: &str) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            method: "a2g/report".to_string(),
            params: ReportParams {
                agent_did: agent_did.to_string(),
                intent_id: intent_id.to_string(),
                status: ExecutionStatus::Failure,
                result: None,
                metrics: None,
                error: Some(error.to_string()),
            },
            id: Uuid::new_v4().to_string(),
        }
    }
}

/// A2G_REGISTER: Agent registers with governance on startup
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct A2gRegister {
    pub jsonrpc: String,
    pub method: String, // "a2g/register"
    pub params: RegisterParams,
    pub id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterParams {
    pub agent_did: String,
    pub public_key: String,
    pub capabilities_requested: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<AgentMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMetadata {
    pub name: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runtime: Option<String>,
}

// =============================================================================
// G2A MESSAGE TYPES (Governance → Agent)
// =============================================================================

/// G2A_VERDICT: Governance responds with approval or denial
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct G2aVerdict {
    pub jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<VerdictResult>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<VerdictError>,
    pub id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerdictResult {
    pub verdict: Verdict,
    pub intent_id: String,
    pub risk_assessment: RiskAssessment,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capability_manifest: Option<CapabilityManifest>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conditions: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Verdict {
    Approved,
    Denied,
    Escalate,
    Conditional,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerdictError {
    pub code: i32,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAssessment {
    pub score: f32,
    pub level: RiskLevel,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_score: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub heuristic_score: Option<f32>,
    #[serde(default)]
    pub threats: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RiskLevel {
    Critical,
    High,
    Medium,
    Low,
}

impl RiskLevel {
    pub fn from_score(score: f32) -> Self {
        match score {
            s if s >= 0.9 => RiskLevel::Critical,
            s if s >= 0.7 => RiskLevel::High,
            s if s >= 0.4 => RiskLevel::Medium,
            _ => RiskLevel::Low,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapabilityManifest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_memory_mb: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_cpu_percent: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timeout_seconds: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub network_allowed: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filesystem_scope: Option<Vec<String>>,
}

/// G2A_POLICY: Governance sends current capabilities to agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct G2aPolicy {
    pub jsonrpc: String,
    pub method: String, // "g2a/policy"
    pub params: PolicyParams,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyParams {
    pub agent_did: String,
    pub version: String,
    pub capabilities: PolicyCapabilities,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub constitution_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyCapabilities {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<std::collections::HashMap<String, ToolPolicy>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub network: Option<NetworkPolicy>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resources: Option<ResourceLimits>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolPolicy {
    pub allowed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub constraints: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkPolicy {
    #[serde(default)]
    pub allowed_domains: Vec<String>,
    #[serde(default)]
    pub blocked_domains: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_requests_per_minute: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_memory_mb: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_cpu_percent: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_disk_mb: Option<u32>,
}
