---
name: Mermaid diagram
description: Create and validate Mermaid diagrams.
---

## Prerequisites

Install `mmdc` (mermaid-cli):

```bash
npm install -g @mermaid-js/mermaid-cli
```

**⚠️ ALWAYS USE `mermaid.sh` SCRIPT** - Never run `mmdc` directly. The script handles Chrome configuration to prevent permission prompts.

## Usage

Create and validate diagrams using the script:

```bash
# Validate from file
./mermaid.sh -f diagram.mmd

# Validate from argument
./mermaid.sh "flowchart TD; A --> B;"

# Validate from stdin
echo "graph TD; A --> B;" | ./mermaid.sh
```

## Diagram Types

### Flowchart Example
```mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

### Application Relationships Example
```mermaid
graph LR
    User[User] -->|HTTPS| Frontend[Frontend]
    Frontend -->|API| Backend[Backend API]
    Backend -->|Query| DB[(Database)]
    Frontend -->|GraphQL| GraphQL[GraphQL Server]
    GraphQL -->|Query| API[External API]
```

- `flowchart`/`graph` - Processes and relationships
- `sequenceDiagram` - Interactions over time
- `classDiagram` - Software architecture
- `gantt` - Project timelines
- `pie` - Data visualization
- `stateDiagram` - State machines
- `erDiagram` - Entity relationships

For syntax: [Mermaid Syntax Guide](https://mermaid.js.org/syntax/)

## Output Format

Present validated diagrams with:
1. Code block using \`\`\`mermaid
2. Brief explanation
3. "✅ Valid Mermaid syntax" confirmation

## Styling

Use **high contrast** colors for better readability:
- Black background
- White text
- Colored borders/connections
- Vivid colors for emphasis

Example styling:
```mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]

    classDef primary fill:#0066ff,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef success fill:#00aa00,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef error fill:#cc0000,stroke:#ffffff,stroke-width:2px,color:#ffffff

    class A primary
    class C success
    class D error
```

## Dark Theme Configuration

For dark background editors (like Cursor), use this theme configuration:

```mermaid
%%{init: {'theme':'dark', 'themeVariables': { 'primaryColor':'#4a90e2','primaryTextColor':'#fff','primaryBorderColor':'#2c5aa0','lineColor':'#81c784','secondaryColor':'#ff9800','tertiaryColor':'#9c27b0','noteBkgColor':'#333','noteTextColor':'#fff','actorBkg':'#2c3e50','actorBorder':'#34495e','actorTextColor':'#ecf0f1','signalColor':'#ecf0f1','signalTextColor':'#ecf0f1','labelBoxBkgColor':'#34495e','labelBoxBorderColor':'#7f8c8d','labelTextColor':'#ecf0f1'}}}%%
sequenceDiagram
    participant A as Service A
    participant B as Service B
    A->>B: Request
    B-->>A: Response
```

### Recommended Stage Colors

For sequence diagrams with multiple stages, use these vivid colors:

```
rect rgb(30, 144, 255)     - DodgerBlue (Initial/Setup phase)
rect rgb(34, 139, 34)      - ForestGreen (Validation phase)
rect rgb(255, 140, 0)      - DarkOrange (Execution phase)
rect rgb(138, 43, 226)     - BlueViolet (Confirmation phase)
rect rgb(72, 61, 139)      - DarkSlateBlue (Polling/Waiting phase)
rect rgb(220, 20, 60)      - Crimson (Error/Exception handling)
```

Example usage:
```mermaid
%%{init: {'theme':'dark', 'themeVariables': { 'primaryColor':'#4a90e2','primaryTextColor':'#fff','primaryBorderColor':'#2c5aa0','lineColor':'#81c784','secondaryColor':'#ff9800','tertiaryColor':'#9c27b0','noteBkgColor':'#333','noteTextColor':'#fff','actorBkg':'#2c3e50','actorBorder':'#34495e','actorTextColor':'#ecf0f1','signalColor':'#ecf0f1','signalTextColor':'#ecf0f1','labelBoxBkgColor':'#34495e','labelBoxBorderColor':'#7f8c8d','labelTextColor':'#ecf0f1'}}}%%
sequenceDiagram
    participant User
    participant API
    participant DB

    rect rgb(30, 144, 255)
        Note over User,API: Setup Phase
        User->>API: Initialize
    end

    rect rgb(34, 139, 34)
        Note over API,DB: Validation Phase
        API->>DB: Validate
        DB-->>API: OK
    end

    rect rgb(138, 43, 226)
        Note over API,User: Confirmation Phase
        API-->>User: Success
    end
```

## References

- [Official Mermaid CLI Documentation](https://github.com/mermaid-js/mermaid-cli)
- [Mermaid Syntax Guide](https://mermaid.js.org/syntax/)
- [Mermaid Live Editor](https://mermaid.live/) - Test diagrams in browser
