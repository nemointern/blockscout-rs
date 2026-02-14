import { BigInt, crypto, Bytes } from "@graphprotocol/graph-ts";
import {
  NameRegistered as NameRegisteredEvent,
  NameRenewed as NameRenewedEvent,
  Transfer as TransferEvent,
} from "../generated/BaseRegistrar/BaseRegistrar";
import {
  Account,
  Domain,
  NameRegistered,
  NameRenewed,
  NameTransferred,
  Registration,
} from "../generated/schema";
import {
  byteArrayFromHex,
  concat,
  createEventID,
  uint256ToByteArray,
  GRACE_PERIOD_SECONDS,
  BTC_NODE_HASH,
  CITREA_NODE_HASH,
  getTldFromIsBTC,
  getRootNodeHash,
} from "./utils";

export function handleNameRegistered(event: NameRegisteredEvent): void {
  let account = new Account(event.params.owner.toHex());
  account.save();

  let label = uint256ToByteArray(event.params.id);
  let isBTC = event.params.isBTC;
  let rootNodeHash = byteArrayFromHex(getRootNodeHash(isBTC));
  
  let domainId = crypto.keccak256(concat(rootNodeHash, label)).toHex();
  let domain = Domain.load(domainId);
  
  if (domain === null) {
    domain = new Domain(domainId);
    domain.createdAt = event.block.timestamp;
    domain.owner = account.id;
    domain.subdomainCount = 0;
    domain.isMigrated = true;
    domain.storedOffchain = false;
    domain.resolvedWithWildcard = false;
  }

  let registration = Registration.load(label.toHex());
  if (registration === null) {
    registration = new Registration(label.toHex());
    registration.domain = domain.id;
    registration.registrationDate = event.block.timestamp;
  }
  
  registration.expiryDate = event.params.expires;
  registration.registrant = account.id;

  domain.registrant = account.id;
  domain.expiryDate = event.params.expires.plus(GRACE_PERIOD_SECONDS);
  domain.isBTC = isBTC;

  // Name will be set by ETHRegistrarController event which has the actual name
  
  domain.save();
  registration.save();

  let registrationEvent = new NameRegistered(createEventID(event));
  registrationEvent.registration = registration.id;
  registrationEvent.blockNumber = event.block.number.toI32();
  registrationEvent.transactionID = event.transaction.hash;
  registrationEvent.registrant = account.id;
  registrationEvent.expiryDate = event.params.expires;
  registrationEvent.save();
}

export function handleNameRenewed(event: NameRenewedEvent): void {
  let label = uint256ToByteArray(event.params.id);
  let registration = Registration.load(label.toHex());
  
  if (registration === null) {
    return;
  }
  
  let isBTC = event.params.isBTC;
  let rootNodeHash = byteArrayFromHex(getRootNodeHash(isBTC));
  
  let domainId = crypto.keccak256(concat(rootNodeHash, label)).toHex();
  let domain = Domain.load(domainId);
  
  if (domain === null) {
    return;
  }

  registration.expiryDate = event.params.expires;
  domain.expiryDate = event.params.expires.plus(GRACE_PERIOD_SECONDS);

  registration.save();
  domain.save();

  let registrationEvent = new NameRenewed(createEventID(event));
  registrationEvent.registration = registration.id;
  registrationEvent.blockNumber = event.block.number.toI32();
  registrationEvent.transactionID = event.transaction.hash;
  registrationEvent.expiryDate = event.params.expires;
  registrationEvent.save();
}

export function handleTransfer(event: TransferEvent): void {
  let account = new Account(event.params.to.toHex());
  account.save();

  let label = uint256ToByteArray(event.params.tokenId);
  let registration = Registration.load(label.toHex());
  
  if (registration === null) {
    return;
  }

  registration.registrant = account.id;
  registration.save();

  let transferEvent = new NameTransferred(createEventID(event));
  transferEvent.registration = registration.id;
  transferEvent.blockNumber = event.block.number.toI32();
  transferEvent.transactionID = event.transaction.hash;
  transferEvent.newOwner = account.id;
  transferEvent.save();
}