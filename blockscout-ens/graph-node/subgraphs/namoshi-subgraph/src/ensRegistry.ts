import { BigInt, crypto, Bytes } from "@graphprotocol/graph-ts";
import {
  NewOwner as NewOwnerEvent,
  Transfer as TransferEvent,
  NewResolver as NewResolverEvent,
  NewTTL as NewTTLEvent,
} from "../generated/ENSRegistry/ENSRegistry";
import {
  Domain,
  Account,
  Resolver,
  NewOwner,
  Transfer,
  NewResolver,
  NewTTL,
} from "../generated/schema";
import {
  ROOT_NODE,
  EMPTY_ADDRESS,
  BTC_NODE,
  CITREA_NODE,
  BTC_TLD,
  CITREA_TLD,
  concat,
  createEventID,
  byteArrayFromHex,
  getParentTld,
  isRootNode,
} from "./utils";

const BIG_INT_ZERO = BigInt.fromI32(0);

function createDomain(node: string, timestamp: BigInt): Domain {
  let domain = new Domain(node);
  domain.owner = EMPTY_ADDRESS;
  domain.isMigrated = true;
  domain.createdAt = timestamp;
  domain.subdomainCount = 0;
  domain.storedOffchain = false;
  domain.resolvedWithWildcard = false;
  return domain;
}

function getDomain(node: string, timestamp: BigInt = BIG_INT_ZERO): Domain | null {
  let domain = Domain.load(node);
  if (domain === null && isRootNode(node)) {
    return createDomain(node, timestamp);
  }
  return domain;
}

function makeSubnode(event: NewOwnerEvent): string {
  return crypto
    .keccak256(concat(event.params.node, event.params.label))
    .toHexString();
}

function recurseDomainDelete(domain: Domain): string | null {
  if (
    (domain.resolver == null ||
      domain.resolver!.split("-")[0] == EMPTY_ADDRESS) &&
    domain.owner == EMPTY_ADDRESS &&
    domain.subdomainCount == 0
  ) {
    const parentDomain = Domain.load(domain.parent!);
    if (parentDomain != null) {
      parentDomain.subdomainCount = parentDomain.subdomainCount - 1;
      parentDomain.save();
      return recurseDomainDelete(parentDomain);
    }
    return null;
  }
  return domain.id;
}

function saveDomain(domain: Domain): void {
  recurseDomainDelete(domain);
  domain.save();
}

export function handleNewOwner(event: NewOwnerEvent): void {
  let account = new Account(event.params.owner.toHex());
  account.save();

  let subnode = makeSubnode(event);
  let parentNode = event.params.node.toHexString();
  let domain = getDomain(subnode, event.block.timestamp);
  
  if (domain === null) {
    domain = new Domain(subnode);
    domain.createdAt = event.block.timestamp;
    domain.subdomainCount = 0;
    domain.isMigrated = true;
    domain.storedOffchain = false;
    domain.resolvedWithWildcard = false;
  }

  if (domain.parent === null && !isRootNode(parentNode)) {
    let parent = getDomain(parentNode, event.block.timestamp);
    if (parent === null) {
      parent = new Domain(parentNode);
      parent.owner = EMPTY_ADDRESS;
      parent.isMigrated = true;
      parent.createdAt = event.block.timestamp;
      parent.subdomainCount = 1;
      parent.storedOffchain = false;
      parent.resolvedWithWildcard = false;
      parent.save();
    } else {
      parent.subdomainCount = parent.subdomainCount + 1;
      parent.save();
    }
    domain.parent = parent.id;
  }

  // Set TLD flag based on parent node
  let tld = getParentTld(parentNode);
  if (tld != "") {
    domain.isBTC = tld == BTC_TLD;
  }

  domain.owner = account.id;
  domain.labelhash = event.params.label;
  saveDomain(domain);

  let domainEvent = new NewOwner(createEventID(event));
  domainEvent.blockNumber = event.block.number.toI32();
  domainEvent.transactionID = event.transaction.hash;
  domainEvent.parentDomain = parentNode;
  domainEvent.domain = domain.id;
  domainEvent.owner = account.id;
  domainEvent.save();
}

export function handleTransfer(event: TransferEvent): void {
  let account = new Account(event.params.owner.toHex());
  account.save();

  let node = event.params.node.toHexString();
  let domain = getDomain(node, event.block.timestamp);
  
  if (domain === null) {
    return;
  }

  domain.owner = account.id;
  saveDomain(domain);

  let domainEvent = new Transfer(createEventID(event));
  domainEvent.blockNumber = event.block.number.toI32();
  domainEvent.transactionID = event.transaction.hash;
  domainEvent.domain = node;
  domainEvent.owner = account.id;
  domainEvent.save();
}

export function handleNewResolver(event: NewResolverEvent): void {
  let node = event.params.node.toHexString();
  let domain = getDomain(node);
  
  if (domain === null) {
    return;
  }

  let resolverAddress = event.params.resolver.toHexString();
  let resolverId = resolverAddress.concat("-").concat(node);
  
  let resolver = Resolver.load(resolverId);
  if (resolver === null) {
    resolver = new Resolver(resolverId);
    resolver.domain = domain.id;
    resolver.address = event.params.resolver;
    resolver.save();
  }

  domain.resolver = resolver.id;
  saveDomain(domain);

  let domainEvent = new NewResolver(createEventID(event));
  domainEvent.blockNumber = event.block.number.toI32();
  domainEvent.transactionID = event.transaction.hash;
  domainEvent.domain = node;
  domainEvent.resolver = resolver.id;
  domainEvent.save();
}

export function handleNewTTL(event: NewTTLEvent): void {
  let node = event.params.node.toHexString();
  let domain = getDomain(node);
  
  if (domain === null) {
    return;
  }

  domain.ttl = event.params.ttl;
  saveDomain(domain);

  let domainEvent = new NewTTL(createEventID(event));
  domainEvent.blockNumber = event.block.number.toI32();
  domainEvent.transactionID = event.transaction.hash;
  domainEvent.domain = node;
  domainEvent.ttl = event.params.ttl;
  domainEvent.save();
}