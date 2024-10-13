const videoElement = document.getElementById('video');
const beepSound = document.getElementById('beep');
const resultElement = document.getElementById('result');
const overlay = document.getElementById('overlay');
const boundingBoxElement = document.getElementById('bounding-box');


// カメラ映像を表示する処理
const constraints = {
    video: {
        width: { ideal: 1280 }, // カメラ解像度
        height: { ideal: 720 },
        facingMode: "environment" // リアカメラを使用
    }
};

// カメラ映像を取得してビデオ要素に表示
navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
        videoElement.srcObject = stream;
    })
    .catch(function(error) {
        console.error("カメラにアクセスできませんでした:", error);
        resultElement.innerText = "カメラのアクセスに失敗しました: " + error.message;
    });

// QuaggaJSを使ってバーコードを読み取る処理
Quagga.init({
    inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector('#video'), // カメラ映像をターゲットにする
        constraints: {
            width: 1280, // QuaggaJSでも高解像度を指定
            height: 720,
            facingMode: "environment", // リアカメラを使用
        },
    },
    locator: {
        patchSize: "large", // 読み取り精度を上げるため、パッチサイズを大きく設定
        halfSample: true // サンプリング精度を高くしてパフォーマンスを向上
    },
    decoder: {
        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "upc_reader"] // 読み取るバーコードの種類
    },
    locate: true // バーコードの位置を検出する機能を有効にする
}, function(err) {
    if (err) {
        console.log(err);
        return;
    }
    Quagga.start(); // QuaggaJSによるバーコード読み取りを開始
});

// 重複バーコードの検出を防ぐためのフラグ
let lastDetectedCode = null;

// バーコードが検出された時の処理
Quagga.onDetected(function(data) {
    const code = data.codeResult.code;
    const box = data.boxes[0]; // バーコードのバウンディングボックスを取得

    // バウンディングボックスが存在する場合に表示
    if (box) {
        const top = Math.min(box[0][1], box[1][1], box[2][1], box[3][1]);
        const left = Math.min(box[0][0], box[1][0], box[2][0], box[3][0]);
        const width = Math.max(box[0][0], box[1][0], box[2][0], box[3][0]) - left;
        const height = Math.max(box[0][1], box[1][1], box[2][1], box[3][1]) - top;

        boundingBoxElement.style.top = `${top}px`;
        boundingBoxElement.style.left = `${left}px`;
        boundingBoxElement.style.width = `${width}px`;
        boundingBoxElement.style.height = `${height}px`;
        boundingBoxElement.style.display = 'block'; // バウンディングボックスを表示
    }

    // 直前に同じバーコードを読み取った場合は無視
    if (code === lastDetectedCode) {
        return;
    }

    // 新しいバーコードを読み取った場合
    lastDetectedCode = code;
    resultElement.innerText = `検出されたバーコード: ${code}`;
    overlay.classList.add('success'); // 枠の色を緑に変更

    // ビープ音を再生
    beepSound.play();
    
const spreadsheetUrl = "https://script.google.com/macros/s/AKfycbzwSJuqSXVAv22pSrbxb4j9h0-4S1rYsCTszSk8TfdOPi9Vm2GmrPWSoycZw_mCk_yk/exec"; // デプロイしたURLをここに設定

function sendBarcode(barcode) {
  const xhr = new XMLHttpRequest(); // XHRオブジェクトを作成

  // リクエストを初期化（非同期）
  xhr.open("POST", spreadsheetUrl, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  // リクエストが完了したときの処理
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) { // リクエストが完了したとき
      if (xhr.status === 200) { // ステータスが200の場合（成功）
        console.log("スプレッドシートに送信成功:", xhr.responseText);
      } else {
        console.error("スプレッドシートへの送信に失敗:", xhr.statusText);
      }
    }
  };

  // 送信するデータをJSON形式に変換
  const data = JSON.stringify({ barcode: barcode });

  // リクエストを送信
  xhr.send(data);
}

// テスト: バーコードを送信
sendBarcode("123456789");



    // 読み取り成功のアニメーション（背景色のフラッシュ）
    document.body.classList.add('flash');
    setTimeout(function() {
        document.body.classList.remove('flash');
        overlay.classList.remove('success'); // 成功表示を戻す
    }, 500); // 0.5秒間フラッシュ

    // バウンディングボックスを非表示
    setTimeout(() => {
        boundingBoxElement.style.display = 'none';
    }, 1000); // 1秒の待機時間を設ける

    // 次のバーコードを読み取る準備をする
    setTimeout(() => {
        lastDetectedCode = null; // 次のバーコードを検出できるようにリセット
    }, 3000);
});
