import { LRUCache } from 'lru-cache';
import 'arrive';
import Graphemer from 'graphemer';

/**
 * This determines timeout of how long will fast chat cache keep recent messages.
 * The default is 1.5 seconds. This defends against all the LULW and Pog avalanches
 * that sometimes happen in large Twitch channel chats.
 */
const FAST_CHAT_CACHE_TIMEOUT = 2_500;
/**
 * Unlimitted cache size for fast messages.
 */
const FAST_CHAT_CACHE_SIZE = 5000;

/**
 * This determines timeout of how long will long messages / copy-pastas be kept in cache.
 */
const LONG_CHAT_CACHE_TIMEOUT = 60 * 1_000;
/**
 * Unlimitted cache size for long messages.
 */
const LONG_CHAT_CACHE_SIZE = 1000;
/**
 * This determines what is considered a long message / copy-pasta.
 */
const LONG_CHAT_THRESHOLD_LENGTH = 150;

const CHAT_SEL = '.chat-list__list-container, .chat-scrollable-area__message-container';
const CHAT_LINE_SEL = '.chat-line__message';
const SPACE_NORM_RE = /([\s])[\s]+/gu;
const BRAILLE_RE = /^[\s\u{2800}-\u{28FF}]+$/u;
// This RegExp is used to replace text added by BTTV extension with just the emote name.
const STRIP_BTTV_TEXT_RE = /(?:^|\s)(\S+)(?:\r\n?|\n)Channel: \S+(?:\r\n?|\n)\S+ Channel Emotes(?:\r\n?|\n)\1(?:$|\s)/gum;

const HIDE_MESSAGE_KEYFRAMES = [
    {
        opacity: '1'
    },
    {
        opacity: '0',
        height: '0'
    }
];

const HIDE_MESSAGE_ANIM_OPTS = { duration: 500, fill: 'forwards' };

const SPLITTER = new Graphemer();

const EMOTE_ANIMATION_STYLE = `
.chat-line__message--emote:hover,
.chat-badge:hover {
    transform: scale(2);
    z-index: 1;
    animation-name: emote-zoom;
    animation-duration: 0.250s;
}
@keyframes emote-zoom {
    from {
        transform: scale(1);
    }
    to {
        transform: scale(2);
    }
}
`;

class SaneTwitchChat {
    #userName = null;
    #prevMessage = null;

    #fastChatCache = new LRUCache({
        max: FAST_CHAT_CACHE_SIZE,
        ttl: FAST_CHAT_CACHE_TIMEOUT,
        updateAgeOnGet: true,
        ttlResolution: 100
    });

    #longChatCache = new LRUCache({
        max: LONG_CHAT_CACHE_SIZE,
        ttl: LONG_CHAT_CACHE_TIMEOUT,
        updateAgeOnGet: true,
        ttlResolution: 1_000
    });

    async #hideNode (msgNode) {
        msgNode.style.color = '#ff0000';
        const animEffects = new KeyframeEffect(
            msgNode,
            HIDE_MESSAGE_KEYFRAMES,
            HIDE_MESSAGE_ANIM_OPTS
        );
        const anim = new Animation(animEffects, document.timeline);
        anim.onfinish = () => { msgNode.style.display = 'none'; };
        anim.play();
    }

    #evaluateMessage (combinedMessage, msgNode) {
        if (!combinedMessage) {
            return;
        }

        // Filter repeated messages.
        if (combinedMessage === this.prevMessage) {
            console.log(`Hiding repeated message: ${combinedMessage}`);
            this.#hideNode(msgNode);
            return;
        }
        this.#prevMessage = combinedMessage;

        // Filter messages with Braille symbols only.
        if (BRAILLE_RE.test(combinedMessage)) {
            console.log(`Hiding Braille only message: ${combinedMessage}`);
            this.#hideNode(msgNode);
            return;
        }

        // Filter chat messages which repeat the same text in very short time.
        // See FAST_CHAT_CACHE_TIMEOUT.
        const factCachedNode = this.#fastChatCache.get(combinedMessage);
        if (factCachedNode !== undefined
            && !Object.is(factCachedNode, msgNode)) {
            console.log(`Hiding message present in fast chat cache: ${combinedMessage}`);
            this.#hideNode(msgNode);
            return;
        }
        if (factCachedNode === undefined) {
            this.#fastChatCache.set(combinedMessage, msgNode);
        }

        // Filter long chat messages which repeat within longer period of time.
        const combinedMessageLength = SPLITTER.countGraphemes(combinedMessage);
        if (combinedMessageLength >= LONG_CHAT_THRESHOLD_LENGTH) {
            const longCachedNode = this.#longChatCache.get(combinedMessage);
            if (longCachedNode !== undefined
                && !Object.is(longCachedNode, msgNode)) {
                console.log(`Hiding long message / copy-pasta present in long chat cache: ${combinedMessage}`);
                this.#hideNode(msgNode);
                return;
            }
            if (longCachedNode === undefined) {
                this.#longChatCache.set(combinedMessage, msgNode);
            }
        }
    }

    #watchChatMessages () {
        document.arrive(CHAT_SEL, (chatNode) => {
            console.log('Sane chat cleanup is enabled.');
            chatNode.arrive(CHAT_LINE_SEL, (msgNode) => {
                const chatLineUserNodes = document.evaluate('.//span/@data-a-user',
                    msgNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                for (let node; (node = chatLineUserNodes.iterateNext());) {
                    if (node?.textContent === this.#userName) {
                        // Do not hide any lines of the user.
                        return;
                    }
                }

                // const xpathResult = document.evaluate('descendant::div[contains(@data-test-selector,"chat-line-message-body")]',
                // msgNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                const xpathResult = document.evaluate(
                    ('descendant::div[contains(@class,"chat-line__message--emote-button")]//span//img'
                    + ' | descendant::a[contains(@class,"link-fragment")]'
                    + ' | descendant::span[contains(@class,"text-fragment") or contains(@class,"mention-fragment")]//div[contains(@class,"bttv-emote")]/img'
                    + ' | descendant::span[contains(@class,"text-fragment") or contains(@class,"mention-fragment")]'),
                    msgNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                const fragments = [];
                for (let node; (node = xpathResult.iterateNext());) {
                    if (node.nodeName === 'IMG') {
                        const alt = node.getAttribute('alt');
                        if (alt) {
                            fragments.push(alt);
                        }
                    } else {
                        fragments.push(node.textContent);
                    }
                }
                const combinedMessage = fragments.join(' ').trim()
                    .replace(SPACE_NORM_RE, '$1')
                    .replace(STRIP_BTTV_TEXT_RE, '$1');
                console.log(`combined message: ${combinedMessage}`);
                this.#evaluateMessage(combinedMessage, msgNode);
            });
        });
    }

    #injectStyleSheet () {
        // Prepare a node.
        const emoteAnimationStyleNode = document.createElement('style');
        emoteAnimationStyleNode.setAttribute('type', 'text/css');
        emoteAnimationStyleNode.setAttribute('id', 'sane-twitch-chat');

        // Fill it with CSS style.
        emoteAnimationStyleNode.textContent = EMOTE_ANIMATION_STYLE;

        // Append the node to <head>.
        document.head.appendChild(emoteAnimationStyleNode);
    }

    constructor (userName) {
        console.log(`Starting Sane Twitch Chat cleanup for user ${userName}`);
        this.#userName = userName || '';
    }

    init () {
        this.#watchChatMessages();
        this.#injectStyleSheet();
    }
};

async function start () {
    let cookies;
    try {
        cookies = await GM.cookie.list({ name: 'name' });
        console.log('I have the cookie jar');
    } catch (e) {
        if (e === 'not supported') {
            // Some implementation might not support GM.cookie interface.
            console.warn('GM.cookie not supported');
        } else {
            console.error(e);
        }
    }
    const userName = cookies?.[0]?.value;
    const saneTwitchChat = new SaneTwitchChat(userName);
    saneTwitchChat.init();
}

if (GM?.info !== undefined) {
    await start()
        .catch(e => console.error(`Error in start(): ${e}`))
        .then(() => console.log('Sane Twitch Chat started'));
}

export {
    start,
    SaneTwitchChat
};
