import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  AddrChanged as AddrChangedEvent,
  AddressChanged as AddressChangedEvent,
  NameChanged as NameChangedEvent,
  ContenthashChanged as ContenthashChangedEvent,
  TextChanged as TextChangedEvent,
} from "../generated/PublicResolver/PublicResolver";
import {
  Domain,
  Resolver,
  Account,
  AddrChanged,
  MulticoinAddrChanged,
  NameChanged,
  ContenthashChanged,
  TextChanged,
} from "../generated/schema";
import { createEventID } from "./utils";

function getOrCreateResolver(node: string, resolverAddress: Bytes): Resolver {
  let resolverId = resolverAddress.toHexString().concat("-").concat(node);
  let resolver = Resolver.load(resolverId);
  
  if (resolver === null) {
    resolver = new Resolver(resolverId);
    resolver.domain = node;
    resolver.address = resolverAddress;
    resolver.save();
  }
  
  return resolver;
}

export function handleAddrChanged(event: AddrChangedEvent): void {
  let node = event.params.node.toHexString();
  let domain = Domain.load(node);
  
  if (domain === null) {
    return;
  }

  let account = new Account(event.params.a.toHex());
  account.save();

  let resolver = getOrCreateResolver(node, event.address);
  resolver.addr = account.id;
  resolver.save();

  domain.resolvedAddress = account.id;
  domain.save();

  let resolverEvent = new AddrChanged(createEventID(event));
  resolverEvent.resolver = resolver.id;
  resolverEvent.blockNumber = event.block.number.toI32();
  resolverEvent.transactionID = event.transaction.hash;
  resolverEvent.addr = account.id;
  resolverEvent.save();
}

export function handleMulticoinAddrChanged(event: AddressChangedEvent): void {
  let node = event.params.node.toHexString();
  let domain = Domain.load(node);
  
  if (domain === null) {
    return;
  }

  let resolver = getOrCreateResolver(node, event.address);
  
  let coinTypes = resolver.coinTypes;
  if (coinTypes === null) {
    coinTypes = [];
  }
  
  let coinType = event.params.coinType;
  if (!coinTypes.includes(coinType)) {
    coinTypes.push(coinType);
    resolver.coinTypes = coinTypes;
    resolver.save();
  }

  let resolverEvent = new MulticoinAddrChanged(createEventID(event));
  resolverEvent.resolver = resolver.id;
  resolverEvent.blockNumber = event.block.number.toI32();
  resolverEvent.transactionID = event.transaction.hash;
  resolverEvent.coinType = coinType;
  resolverEvent.addr = event.params.newAddress;
  resolverEvent.save();
}

export function handleNameChanged(event: NameChangedEvent): void {
  let node = event.params.node.toHexString();
  let resolver = getOrCreateResolver(node, event.address);

  let resolverEvent = new NameChanged(createEventID(event));
  resolverEvent.resolver = resolver.id;
  resolverEvent.blockNumber = event.block.number.toI32();
  resolverEvent.transactionID = event.transaction.hash;
  resolverEvent.name = event.params.name;
  resolverEvent.save();
}

export function handleContentHashChanged(event: ContenthashChangedEvent): void {
  let node = event.params.node.toHexString();
  let resolver = getOrCreateResolver(node, event.address);
  
  resolver.contentHash = event.params.hash;
  resolver.save();

  let resolverEvent = new ContenthashChanged(createEventID(event));
  resolverEvent.resolver = resolver.id;
  resolverEvent.blockNumber = event.block.number.toI32();
  resolverEvent.transactionID = event.transaction.hash;
  resolverEvent.hash = event.params.hash;
  resolverEvent.save();
}

export function handleTextChanged(event: TextChangedEvent): void {
  let node = event.params.node.toHexString();
  let resolver = getOrCreateResolver(node, event.address);
  
  let texts = resolver.texts;
  if (texts === null) {
    texts = [];
  }
  
  let key = event.params.key;
  if (!texts.includes(key)) {
    texts.push(key);
    resolver.texts = texts;
    resolver.save();
  }

  let resolverEvent = new TextChanged(createEventID(event));
  resolverEvent.resolver = resolver.id;
  resolverEvent.blockNumber = event.block.number.toI32();
  resolverEvent.transactionID = event.transaction.hash;
  resolverEvent.key = key;
  resolverEvent.value = event.params.value;
  resolverEvent.save();
}