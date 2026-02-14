import { BigInt, ByteArray, Bytes, crypto, ethereum } from "@graphprotocol/graph-ts";

// Namoshi-specific constants
export const BTC_NODE = "0xf702f1b03281458158bc938ae02bb9e415467e8a03af28a2c5e55b6a55192b77";
export const CITREA_NODE = "0x45e2eb5062b833c50fa834c0e45b3051fe61426b0a0a4d9e6b19239b600a033d";
export const BTC_NODE_HASH = "f702f1b03281458158bc938ae02bb9e415467e8a03af28a2c5e55b6a55192b77";
export const CITREA_NODE_HASH = "45e2eb5062b833c50fa834c0e45b3051fe61426b0a0a4d9e6b19239b600a033d";

export const ROOT_NODE = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
export const EMPTY_ADDRESS_BYTEARRAY = new ByteArray(20);

export const BTC_TLD = ".btc";
export const CITREA_TLD = ".citrea";

export const GRACE_PERIOD_SECONDS = BigInt.fromI32(7776000); // 90 days

export function byteArrayFromHex(s: string): ByteArray {
  if (s.length % 2 !== 0) {
    throw new TypeError("Hex string must have an even number of characters");
  }
  let out = new Uint8Array(s.length / 2);
  for (let i = 0; i < s.length; i += 2) {
    out[i / 2] = parseInt(s.substring(i, i + 2), 16) as u8;
  }
  return changetype<ByteArray>(out);
}

export function concat(a: ByteArray, b: ByteArray): ByteArray {
  let out = new Uint8Array(a.length + b.length);
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i];
  }
  for (let j = 0; j < b.length; j++) {
    out[a.length + j] = b[j];
  }
  return changetype<ByteArray>(out);
}

export function createEventID(event: ethereum.Event): string {
  return event.block.number.toString()
    .concat("-")
    .concat(event.logIndex.toString());
}

export function uint256ToByteArray(i: BigInt): ByteArray {
  let hex = i.toHexString().slice(2).padStart(64, "0");
  return byteArrayFromHex(hex);
}

export function getTldFromIsBTC(isBTC: boolean): string {
  return isBTC ? BTC_TLD : CITREA_TLD;
}

export function getRootNodeHash(isBTC: boolean): string {
  return isBTC ? BTC_NODE_HASH : CITREA_NODE_HASH;
}

export function getRootNode(isBTC: boolean): string {
  return isBTC ? BTC_NODE : CITREA_NODE;
}

export function isRootNode(node: string): boolean {
  let normalized = node.toLowerCase();
  return normalized == BTC_NODE.toLowerCase() || 
         normalized == CITREA_NODE.toLowerCase() ||
         normalized == ROOT_NODE.toLowerCase();
}

export function getParentTld(parentNode: string): string {
  let normalized = parentNode.toLowerCase();
  if (normalized == BTC_NODE.toLowerCase()) {
    return BTC_TLD;
  } else if (normalized == CITREA_NODE.toLowerCase()) {
    return CITREA_TLD;
  }
  return "";
}

export function checkValidLabel(name: string): boolean {
  for (let i = 0; i < name.length; i++) {
    let c = name.charCodeAt(i);
    if (c === 0) {
      return false;
    }
  }
  return true;
}