// キーボードの入力状態を管理する配列を定義
let input_key = new Array();
// キーボードの入力イベント
// Keyを押下時の関数（keydown）
window.addEventListener("keydown", handleKeydown);
function handleKeydown(e) {
    /*alert(`${e.keyCode}が押されたよ`)*/
    input_key[e.keyCode] = true;
}

// Keyを離す際の関数（keyup）
window.addEventListener("keyup", handleKeyup);
function handleKeyup(e) {
    input_key[e.keyCode] = false;
}

// canvas要素の取得
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
//canvas要素の高さ幅の設定
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 640;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// キャラクターの設定
const IMG_SIZE = 80;
// キャラクターの操作速度
const CHARA_SPEED = 4;
// キャラクターの配置初期値
let x = 0;
let y = 300;
// 上下方向の速度
let vy = 0; // 正の時：落下中; 負の時：上昇中;
// ジャンプしたかのフラグ値
let isJump = false;

// ゲームオーバのフラグ値
let isGameOver = false;
// ゲームクリアのフラグ値
let isGameClear = false;

// ゴール位置の設定（ちいかわの位置）
const GOAL_X = 850;
const GOAL_Y = 320;

// ブロック要素の定義
let blocks = [
    { x: 0, y: 600, w: 400, h: 40 },
    { x: 400, y: 500, w: 250, h: 40 },
    { x: 650, y: 400, w: 310, h: 40 },
];

// 敵の情報
let enemies = [
    {x: 550, y: 0, isJump: true, vy: 0},
    {x: 750, y: 0, isJump: true, vy: 0},
    {x: 300, y: 180, isJump: true, vy: 0},
];
const ENEMY_SPEED = 1;

// ロード時に画面描写の処理が実行される
window.addEventListener("load", update);
// 画面を更新する関数を定義
function update() {
    // 毎回画面をクリア設定
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // 敵の設定
    for (const enemy of enemies) {
        let updatedEnemyX = enemy.x;
        let updatedEnemyY = enemy.y;
        let updatedEnemyInJump = enemy.isJump;
        let updatedEnemyVy = enemy.vy;
        updatedEnemyX = updatedEnemyX - ENEMY_SPEED;
        if (enemy.isJump) {
            updatedEnemyY = enemy.y + enemy.vy;
            updatedEnemyVy = enemy.vy + 0.5;
            const BlockTargetIsOn = getBlockTargetIsOn(enemy.x, enemy.y, updatedEnemyX, updatedEnemyY);
            if (BlockTargetIsOn !== null) { // ブロックが取得できた場合には、着地させる
                updatedEnemyY = BlockTargetIsOn.y - IMG_SIZE; // 地面で止まる
                updatedEnemyInJump = false;
            }
        } else { // ジャンプしていない状態でブロックが取得できなかった場合
            if (getBlockTargetIsOn(enemy.x, enemy.y, updatedEnemyX, updatedEnemyY) === null) {
                updatedEnemyInJump = true; // 上のif文が適用される
                updatedEnemyVy = 0;
            }
        }
        enemy.x = updatedEnemyX;
        enemy.y = updatedEnemyY;
        enemy.isJump = updatedEnemyInJump;
        enemy.vy = updatedEnemyVy;
    }

    let updatedX = x;
    let updatedY = y;
    if (isGameClear) {
        alert("GAME COMPLETE");
        isGameClear = false;
        isJump = false;
        updatedX = 0;
        updatedY = 0;
        vy = 0;
    } else if (isGameOver) {
        updatedY = y + vy;
        vy = vy + 0.5;
        if (y > CANVAS_HEIGHT) { //キャラが更に下に落ちてきた時
            alert("GAME OVER");
            isGameOver = false;
            isJump = false;
            updatedX = 0;
            updatedY = 0;
            vy = 0;
        }
    } else {
        // キーボード操作設定
        if (input_key[37]) {
            updatedX = x - CHARA_SPEED;
        }
        if (input_key[38] && !isJump) {
            /* updatedY = y - CHARA_SPEED; */
            vy = -10;
            isJump = true;
        }
        if (input_key[39]) {
            updatedX = x + CHARA_SPEED;
        }
        if (isJump) {
            updatedY = y + vy;
            vy = vy + 0.4; // ジャンプの高さ
            const BlockTargetIsOn = getBlockTargetIsOn(x, y, updatedX, updatedY);
            if (BlockTargetIsOn !== null) { // ブロックが取得できた場合には、着地させる
                updatedY = BlockTargetIsOn.y - IMG_SIZE; // 地面で止まる
                isJump = false;
            }
        } else { // ジャンプしていない状態でブロックが取得できなかった場合
            if (getBlockTargetIsOn(x, y, updatedX, updatedY) === null) {
                isJump = true; // 上のif文が適用される
                vy = 0;
            }
        }
        if (y > CANVAS_HEIGHT) { // 下まで落ちたらゲームオーバー
            isGameOver = true;
            updatedY = CANVAS_HEIGHT; // 一度その場所に固定
            vy = -15;
        }
    }
    
    x = updatedX;
    y = updatedY;

    if (!isGameOver) {
        for (const enemy of enemies) { // 全て敵で当たり判定を調査
            let isHit = isAreaOverlap(x, y, IMG_SIZE, IMG_SIZE, enemy.x, enemy.y, IMG_SIZE, IMG_SIZE);
            if (isHit) { // 重なっていて
                if (isJump && vy > 0) { // ジャンプしていて、落下している状態で敵に衝突した場合は
                    vy = -7; //上向のジャンプ
                    enemy.y = CANVAS_HEIGHT; // 敵を消し去る（見えないに移動させる）
                } else { // それ以外で衝突した場合は
                    isGameOver = true; // ゲームオーバー
                    vy = -10; // 上へ飛び上がる
                }
            }
        }
        // もしも「ちいかわ」に衝突したらクリアとする
        isHit = isAreaOverlap(x, y, IMG_SIZE, IMG_SIZE, GOAL_X, GOAL_Y, IMG_SIZE, IMG_SIZE);
        if (isHit) {
            isGameClear = true;
        }
    }

    // うさぎの画像を表示
    let image = new Image();
    image.src = "img/Usagi.png";
    ctx.drawImage(image, x, y, IMG_SIZE, IMG_SIZE);

    // モモンガの画像を表示
    let enemyImage = new Image();
    enemyImage.src = "img/Momonga.jpg";
    for (const enemy of enemies) {
        ctx.drawImage(enemyImage, enemy.x, enemy.y, IMG_SIZE, IMG_SIZE);
    }

    // ちいかわの画像を表示
    image = new Image();
    image.src = "img/Chikawa.png";
    ctx.drawImage(image, GOAL_X, GOAL_Y, IMG_SIZE, IMG_SIZE);

    // ブロックを表示
    ctx.fillStyle = "Orange";
    for (const block of blocks) {
        ctx.fillRect(block.x, block.y, block.w, block.h);
    }

    window.requestAnimationFrame(update);
}

// ブロック上に存在していればそのブロックの情報を返す、存在していなければ「null」を返す
function getBlockTargetIsOn(x, y, updatedX, updatedY) {
    for (const block of blocks) {
        // 更新前はキャラ下部が地面以上　且つ　更新後はキャラ下部が地面以下
        if (y + IMG_SIZE <= block.y && updatedY + IMG_SIZE >= block.y) {
            if (//このifを満たす時は、ブロックが存在しないので、取得不可
                //キャラ右端 <= ブロック左端 または キャラ左端 >= ブロック右端
                (x + IMG_SIZE <= block.x || x >= block.x + block.w) &&
                (updatedX + IMG_SIZE <= block.x || updatedX >= block.x + block.w)
            ) {
                // ブロックの上に居ない場合には、何もしない
                continue;
            }
            // ブロックの上に居る場合には、そのブロック要素を返す
            return block;
        }
    }// 最後までブロック要素を返さなかった場合（全て「continue」処理された場合）
    return null; //ブロック要素の上に居ないということなので「null」を返却する
}

// キャラの左上の角の座標を（cx, cy）、幅をcw、 高さをchとする
// 敵の左上の角の座標を（ex, ey）、幅をew、高さをehとする
function isAreaOverlap(cx, cy, cw, ch, ex, ey, ew, eh) {
    if (ex + ew < cx) return false; //キャラの左と敵の右
    if (cx + cw < ex) return false; //キャラの右と敵の左
    if (ey + eh < cy) return false; //キャラの上と敵の下
    if (cy + ch < ey) return false; //キャラの下と敵の上
    return true; // ここまで到達する場合には、何処かしらで重なる
}

// 効果音再生用のオーディオ要素を作成
let jumpSound = new Audio("Sounds/Usagi.mp4");

// ジャンプ時の音声再生
function playJumpSound() {
    jumpSound.currentTime = 0; // 再生位置を初期化（連続で再生するため）
    jumpSound.play();
}

function handleKeydown(e) {
    /*alert(`${e.keyCode}が押されたよ`)*/
    if (e.keyCode === 38) { // 上向き矢印キー（ジャンプキー）
        playJumpSound(); // ジャンプ効果音の再生
    }
    input_key[e.keyCode] = true;
}
