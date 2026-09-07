#!/usr/bin/env bash

# macOS Finder에서 더블 클릭으로 바로 실행 가능한 스크립트
cd "$(dirname "$0")" || exit 1
bash ./start.sh
