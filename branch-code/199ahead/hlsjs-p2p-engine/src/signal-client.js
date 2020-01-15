
import EventEmitter from 'events';
import ReconnectingWebSocket from 'reconnecting-websocket';

const PING_MSG = 9;
const PING_INTERVAL = 60;

class SignalClient extends EventEmitter{
    constructor(engine, peerId, config) {
        super();
        this.engine = engine;
        this.logger = engine.logger;
        this.peerId = peerId;
        this.config = config;
        this.wsAddr = config.wsSignalerAddr;
        this.connected = false;
        this.msgQueue = [];
        this._ws = this._init(peerId);
    }

    _init(id) {
        const wsOptions = {
            // debug: true,
            maxRetries: this.config.wsMaxRetries,
            minReconnectionDelay: this.config.wsReconnectInterval * 1000
        };
        let queryStr = `?id=${id}`;
        let ws = new ReconnectingWebSocket(this.wsAddr + queryStr, undefined, wsOptions);
        ws.onopen = () => {
            this.logger.info('Signaler websocket connection opened');

            this.connected = true;

            // 发送所有没有成功发送的消息
            if (this.msgQueue.length > 0) {
                this.logger.warn(`resend all cached msg`);
                this.msgQueue.forEach(msg => {
                    this._ws.send(msg);
                });
                this.msgQueue = [];
            }

            if (this.onopen) this.onopen();

            this._startPing();    // 开始发送心跳包
        };

        ws.push = ws.send;
        ws.send = msg => {
            let msgStr = JSON.stringify(Object.assign({peer_id: id}, msg));
            ws.push(msgStr);

            this._resetPing();    // 重置心跳
        };
        ws.onmessage = (e) => {

            if (this.onmessage) this.onmessage(e)

        };
        ws.onclose = () => {                                            //websocket断开时清除datachannel
            this.logger.warn(`Signaler websocket closed`);
            if (this.onclose) this.onclose();
            this.connected = false;

            this._stopPing();    // 停止心跳
        };
        return ws;
    }

    sendSignal(remotePeerId, data) {
        let msg = {
            action: 'signal',
            peer_id: this.peerId,
            to_peer_id: remotePeerId,
            data: data
        };
        this._send(msg);
    }

    _send(msg) {
        if (this.connected) {
            this._ws.send(msg);
        } else {
            this.logger.warn(`signaler closed, msg is cached`);
            this.msgQueue.push(msg);
        }

    }

    _startPing() {
        this.pingTimer = window.setInterval(() => {
            this._ws.send(PING_MSG);
        }, PING_INTERVAL * 1000)
    }

    _resetPing() {
        this._stopPing();
        this._startPing();
    }

    _stopPing() {
        window.clearInterval(this.pingTimer);
        this.pingTimer = null;
    }

    close() {
        this.logger.warn(`close signal client`);
        this.connected = false;
        this._ws.close(1000, 'stop signaling', {keepClosed: true});

    }

    destroy() {
        this.close();
        this._ws = null;
        this.removeAllListeners();
        this.logger.warn(`destroyt signaler`);
    }
}

export default SignalClient;