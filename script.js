const videoElement = document.getElementById('video');
const beepSound = document.getElementById('beep');
const resultElement = document.getElementById('result');
const overlay = document.getElementById('overlay');
const boundingBoxElement = document.getElementById('bounding-box');

// Google Apps ScriptのURLをここに設定
const spreadsheetUrl = "https://script.google.com/macros/s/AKfycbyO-_CnogdEGn2SOajKNg4spAw-bzcnA1lMnzCPQzNi7TT2_ZL-JalTxo24xnl3sGPKgw/exec";

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

   // 読み取ったバーコードをGoogleスプレッドシートに送信
   fetch(spreadsheetUrl, {
    redirect: "follow",
    method: "POST",
    headers: {
        "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({ barcode: code })
})
.then(response => response.json())
.then(data => {
    console.log("スプレッドシートに送信成功:", data);
})
.catch(error => {
    console.error("スプレッドシートへの送信に失敗:", error);
});




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
    }, 1000);
});
