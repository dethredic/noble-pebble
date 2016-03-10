var debug = require('debug')('smp');

var events = require('events');
var util = require('util');

var crypto = require('./crypto');

var SMP_CID = 0x0006;

var SMP_PAIRING_REQUEST = 0x01;
var SMP_PAIRING_RESPONSE = 0x02;
var SMP_PAIRING_CONFIRM = 0x03;
var SMP_PAIRING_RANDOM = 0x04;
var SMP_PAIRING_FAILED = 0x05;
var SMP_ENCRYPT_INFO = 0x06;
var SMP_MASTER_IDENT = 0x07;
var SMP_IDENTITY_IDENT = 0x08;
var SMP_IDENTITY_ADDR_IDENT = 0x09;
var SMP_SIGNING_INFO = 0x0A;
var SMP_SECURITY_REQUEST = 0x0B;

var Smp = function(aclStream, localAddressType, localAddress, remoteAddressType, remoteAddress) {
  this._aclStream = aclStream;

  this._iat = new Buffer([(localAddressType === 'random') ? 0x01 : 0x00]);
  this._ia = new Buffer(localAddress.split(':').reverse().join(''), 'hex');
  this._rat = new Buffer([(remoteAddressType === 'random') ? 0x01 : 0x00]);
  this._ra = new Buffer(remoteAddress.split(':').reverse().join(''), 'hex');

  this.onAclStreamDataBinded = this.onAclStreamData.bind(this);
  this.onAclStreamEndBinded = this.onAclStreamEnd.bind(this);

  this._aclStream.on('data', this.onAclStreamDataBinded);
  this._aclStream.on('end', this.onAclStreamEndBinded);
};

util.inherits(Smp, events.EventEmitter);

Smp.prototype.sendPairingRequest = function() {
  this._preq = new Buffer([
    SMP_PAIRING_REQUEST,
    0x03, // IO capability: NoInputNoOutput
    0x00, // OOB data: Authentication data not present
    0x01, // Authentication requirement: Bonding - No MITM
    0x10, // Max encryption key size
    0x03, // Initiator key distribution
    0x03  // Responder key distribution
  ]);

  this.write(this._preq);
};

Smp.prototype.onAclStreamData = function(cid, data) {
  if (cid !== SMP_CID) {
    return;
  }

  var code = data.readUInt8(0);

  if (SMP_PAIRING_RESPONSE === code) {
    this.handlePairingResponse(data);
  } else if (SMP_PAIRING_CONFIRM === code) {
    this.handlePairingConfirm(data);
  } else if (SMP_PAIRING_RANDOM === code) {
    this.handlePairingRandom(data);
  } else if (SMP_PAIRING_FAILED === code) {
    this.handlePairingFailed(data);
  } else if (SMP_ENCRYPT_INFO === code) {
    this.handleEncryptInfo(data);
  } else if (SMP_MASTER_IDENT === code) {
    this.handleMasterIdent(data);
  } else if (SMP_IDENTITY_IDENT === code) {
    this.handleIdentityIdent(data);
  } else if (SMP_IDENTITY_ADDR_IDENT === code) {
    this.handleIdentityAddrIdent(data);
  } else if (SMP_SIGNING_INFO === code) {
    this.handleSigningInfo(data);
  } else if (SMP_SECURITY_REQUEST == code) {
    this.handleSecurityRequest(data);
  } else {
    console.log('Unhandled SMP MSG: ' + code);
  }
};

Smp.prototype.onAclStreamEnd = function() {
  this._aclStream.removeListener('data', this.onAclStreamDataBinded);
  this._aclStream.removeListener('end', this.onAclStreamEndBinded);

  this.emit('end');
};

Smp.prototype.handlePairingResponse = function(data) {
  // console.log('handlePairingResponse');

  this._pres = data;

  this._tk = new Buffer('00000000000000000000000000000000', 'hex');
  this._r = crypto.r();

  var out = Buffer.concat([
    new Buffer([SMP_PAIRING_CONFIRM]),
    crypto.c1(this._tk, this._r, this._pres, this._preq, this._iat, this._ia, this._rat, this._ra)
  ]);

  this.write(out);
};

Smp.prototype.handlePairingConfirm = function(data) {
  // console.log('handlePairingConfirm');
  this._pcnf = data;

  this.write(Buffer.concat([
    new Buffer([SMP_PAIRING_RANDOM]),
    this._r
  ]));
};

Smp.prototype.handlePairingRandom = function(data) {
  // console.log('handlePairingRandom');
  var r = data.slice(1);

  var pcnf = Buffer.concat([
    new Buffer([SMP_PAIRING_CONFIRM]),
    crypto.c1(this._tk, r, this._pres, this._preq, this._iat, this._ia, this._rat, this._ra)
  ]);

  if (this._pcnf.toString('hex') === pcnf.toString('hex')) {
    var stk = crypto.s1(this._tk, r, this._r);

    this.emit('stk', stk);
  } else {
    this.write(new Buffer([
      SMP_PAIRING_RANDOM,
      SMP_PAIRING_CONFIRM
    ]));

    this.emit('fail');
  }
};

Smp.prototype.handlePairingFailed = function(data) {
  console.log('handlePairingFailed');
  this.emit('fail');
};

Smp.prototype.handleEncryptInfo = function(data) {
  // console.log('handleEncryptInfo');
  var ltk = data.slice(1);

  this.emit('ltk', ltk);

  // Respond with our LTK
  this.write(new Buffer([
    SMP_ENCRYPT_INFO,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]));
};

Smp.prototype.handleMasterIdent = function(data) {
  // console.log('handleMasterIdent');
  var ediv = data.slice(1, 3);
  var rand = data.slice(3);

  this.emit('masterIdent', ediv, rand);

  // Respond with our EDIV / RAND
  this.write(new Buffer([
    SMP_MASTER_IDENT,
    0x00, 0x00, // EDIV
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // RAND
  ]));
};

Smp.prototype.handleIdentityIdent = function(data) {
  // console.log('handleIdentityIdent');
  var irk = data.slice(1);

  this.emit('identityIdent', irk);

  // Respond with our IRK
  this.write(new Buffer([
    SMP_IDENTITY_IDENT,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]));
};

Smp.prototype.handleIdentityAddrIdent = function(data) {
  // console.log('handleIdentityAddrIdent');
  var addr_type = data.slice(1, 2);
  var bd_addr = data.slice(2);

  this.emit('identityAddrIdent', addr_type, bd_addr);

  // Respond with our addr info
  this.write(new Buffer([
    SMP_IDENTITY_ADDR_IDENT,
    0x00, // AddrType
    0xA1, 0xB2, 0x76, 0x70, 0xF3, 0x5C, // Addr
  ]));
};

Smp.prototype.handleSigningInfo = function(data) {
  // console.log('handleSigningInfo');
  var sk = data.slice(1);

  this.emit('signingInfo', sk);

  // Respond with our signing key
  // this.write(new Buffer([
  //   SMP_SIGNING_INFO,
  //   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  // ]));
};

Smp.prototype.handleSecurityRequest = function(data) {
  // console.log('handleSecurityRequest');

  this._preq = new Buffer([
    SMP_PAIRING_REQUEST,
    0x03, // IO capability: NoInputNoOutput
    0x00, // OOB data: Authentication data not present
    0x01, // Authentication requirement: Bonding - No MITM
    0x10, // Max encryption key size
    0x03, // Initiator key distribution
    0x03  // Responder key distribution
  ]);

  this.write(this._preq);
};

Smp.prototype.write = function(data) {
  this._aclStream.write(SMP_CID, data);
};

module.exports = Smp;
