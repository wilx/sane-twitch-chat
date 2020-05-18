let Arrive = require("arrive");
import LRUCache from "lru-cache";

console.log('Starting Sane chat cleanup');

const CHAT_SEL = ".chat-list__list-container, .chat-scrollable-area__message-container";
const CHAT_LINE_SEL = ".chat-line__message";
const SPACE_NORM_RE = /([\s])[\s]+/gu;
const FAST_CHAT_CACHE_TIMEOUT = 1500;
const FAST_CHAT_CACHE_SIZE = 30;

let prevMessage = undefined;
let fastChatCache = new LRUCache({
    max: FAST_CHAT_CACHE_SIZE,
    maxAge: FAST_CHAT_CACHE_TIMEOUT,
    length: () => 1
});

function hideNode(msgNode) {
    //msgNode.style.display = "none";
    //msgNode.style.color = "#ff0000";
    //let removeAnim = msgNode.animate([{display: 'none';}], {duration: 500});
    let animOpt = {duration: 500, fill: "forwards"};
    new Promise((resolutionFunc, rejectionFunc) => {
        msgNode.style.color = "#ff0000";
        let anim = msgNode.animate([
            {
                opacity: '1'
            },
            {
                opacity : '0',
                height: '0'
            }
        ], animOpt);
        anim.pause();
        anim.onfinish = () => { msgNode.style.display = "none"; };
        anim.play();
        resolutionFunc(true);
    }).then((x) => {
        //msgNode.style.display = 'none';
        //console.log("Animation finished.");
    });
}

function evaluateMessage(combinedMessage, msgNode) {
    if (!combinedMessage) {
        return;
    }

    if (combinedMessage === prevMessage) {
        console.log("Hiding repeated message: " + combinedMessage);
        hideNode(msgNode);
        return;
    }
    prevMessage = combinedMessage;

    let factCachedNode = fastChatCache.get(combinedMessage);
    if (factCachedNode !== undefined) {
        console.log("Hiding message present in fast chat cache: " + combinedMessage);
        hideNode(msgNode)
        return;
    }
    fastChatCache.set(combinedMessage, msgNode);
}

document.arrive(CHAT_SEL, (chatNode) => {
    console.log('Sane chat cleanup is enabled.');
    chatNode.arrive(CHAT_LINE_SEL, (msgNode) => {
        let xpathResult = document.evaluate('child::span[contains(@class,"text-fragment") or contains(@class,"mention-fragment")]' 
            + ' | child::div[contains(@class,"chat-line__message--emote-button")]/span/img'
            + ' | child::a[contains(@class,"link-fragment")]',
            msgNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null );
        let node;
        let fragments = [];
        while (node = xpathResult.iterateNext()) {
            if (node.nodeName === "IMG") {
                let alt = node.getAttribute("alt");
                if (alt) {
                    fragments.push(alt)
                }
            }
            else {
                fragments.push(node.textContent);
            }
        }
        let combinedMessage = fragments.join(" ").trim().replace(SPACE_NORM_RE, "$1");
        console.log("combined message: " + combinedMessage);
        evaluateMessage(combinedMessage, msgNode);
    });
});
