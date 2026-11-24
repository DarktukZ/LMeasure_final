#!/bin/bash
# ดับเบิลคลิกเพื่อเปิดเกม (ต้องเปิดผ่านเซิร์ฟเวอร์ในเครื่อง เพลง YouTube จึงจะเล่นได้)
cd "$(dirname "$0")"
PORT=8765
if ! lsof -i :$PORT >/dev/null 2>&1; then
  python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
  sleep 1
fi
open "http://localhost:$PORT/index.html"
echo "เกมเปิดแล้วที่ http://localhost:$PORT  (ปิดหน้าต่างนี้ได้ เกมยังเล่นต่อได้จนกว่าจะปิดเครื่อง)"
