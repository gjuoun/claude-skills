#!/usr/bin/env bash
#
# Mermaid Diagram Validation Script
# Validates Mermaid syntax using mmdc (mermaid-cli)
#
# Usage:
#   ./mermaid.sh "graph TD; A --> B;"              # Validate from argument
#   ./mermaid.sh -f diagram.mmd                    # Validate from file
#   echo "graph TD; A --> B;" | ./mermaid.sh      # Validate from stdin
#   ./mermaid.sh --help                            # Show help
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
    cat << EOF
${BLUE}Mermaid Diagram Validator${NC}

Validates Mermaid syntax using mmdc (mermaid-cli)

${YELLOW}USAGE:${NC}
    $(basename "$0") [OPTIONS] [MERMAID_CODE]

${YELLOW}OPTIONS:${NC}
    -f, --file FILE     Validate Mermaid diagram from file
    -h, --help          Show this help message

${YELLOW}INPUT METHODS:${NC}
    1. Command line argument:
       $(basename "$0") "graph TD; A --> B;"

    2. From file:
       $(basename "$0") -f diagram.mmd

    3. From stdin:
       echo "graph TD; A --> B;" | $(basename "$0")"

${YELLOW}EXAMPLES:${NC}
    $(basename "$0") "flowchart TD; A[Start] --> B[End]"
    $(basename "$0") -f my-diagram.mmd
    cat diagram.mmd | $(basename "$0")

${YELLOW}PREREQUISITES:${NC}
    This script requires 'mmdc' (mermaid-cli) to be installed.

    Install with:
    ${GREEN}npm install -g @mermaid-js/mermaid-cli${NC}

${YELLOW}EXIT CODES:${NC}
    0 - Valid Mermaid syntax
    1 - Invalid Mermaid syntax or error occurred
EOF
}

# Function to validate Mermaid diagram
validate_mermaid() {
    local mermaid_code="$1"

    # Check if mmdc is available
    if ! command -v mmdc &> /dev/null; then
        echo -e "${RED}Error: mmdc (mermaid-cli) is not installed${NC}" >&2
        echo -e "${YELLOW}Please install it with:${NC} npm install -g @mermaid-js/mermaid-cli" >&2
        return 1
    fi

    # Create temporary directory
    local tmp_dir="./tmp"
    mkdir -p "$tmp_dir"

    # Generate unique temporary filenames
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local temp_mmd="${tmp_dir}/mermaid_${timestamp}.mmd"
    local temp_out="${tmp_dir}/mermaid-out_${timestamp}.svg"

    # Write diagram to temporary file
    echo "$mermaid_code" > "$temp_mmd"

    # Validate using mmdc with Chrome flags to suppress permission prompts
    # The script always uses these flags to prevent Chrome/Puppeteer from asking for permissions
    export PUPPETEER_NO_SANDBOX=true
    export CHROME_FLAGS="--disable-dev-shm-usage --disable-web-security --disable-features=WebUSB,WebBluetooth --no-sandbox --disable-setuid-sandbox --disable-extensions --mute-audio --disable-software-rasterizer"

    if mmdc -i "$temp_mmd" -o "$temp_out" -q 2>/dev/null; then
        echo -e "${GREEN}✅ Valid Mermaid syntax${NC}"
        rm -f "$temp_mmd" "$temp_out" 2>/dev/null || true
        return 0
    else
        echo -e "${RED}❌ Invalid Mermaid syntax${NC}" >&2
        echo -e "${YELLOW}Error details:${NC}" >&2
        mmdc -i "$temp_mmd" -o "$temp_out" 2>&1 >&2
        rm -f "$temp_mmd" "$temp_out" 2>/dev/null || true
        return 1
    fi
}

# Parse command line arguments
FILE=""
INPUT_CODE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--file)
            FILE="$2"
            shift 2
            ;;
        -*)
            echo -e "${RED}Error: Unknown option: $1${NC}" >&2
            echo -e "${YELLOW}Use --help for usage information${NC}" >&2
            exit 1
            ;;
        *)
            INPUT_CODE="$1"
            shift
            ;;
    esac
done

# Determine input source
if [[ -n "$FILE" ]]; then
    # Validate from file
    if [[ ! -f "$FILE" ]]; then
        echo -e "${RED}Error: File not found: $FILE${NC}" >&2
        exit 1
    fi
    INPUT_CODE=$(cat "$FILE")
elif [[ -n "$INPUT_CODE" ]]; then
    # Validate from command line argument
    : # Input already set
elif [[ ! -t 0 ]]; then
    # Validate from stdin
    INPUT_CODE=$(cat)
fi

# Check if we have input
if [[ -z "$INPUT_CODE" ]]; then
    echo -e "${RED}Error: No Mermaid code provided${NC}" >&2
    echo -e "${YELLOW}Use --help for usage information${NC}" >&2
    exit 1
fi

# Validate the Mermaid diagram
validate_mermaid "$INPUT_CODE"
exit $?
