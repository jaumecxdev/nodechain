# scripts/generate-certs.sh
# chmod u+r+x generate-certs.sh
# npm run generate:certs
# Windows: https://www.cygwin.com o manual line x line

# GENERATE SERVER & CLIENT CERTIFICATES
# 
# SERVER
# ca.crt			CA ROOT CERT			a certificate authority public key for signing .csr files
# server.key		SERVER PRIVATE KEY		a private client RSA key to sign and authenticate the public key
# server.crt		SERVER SIGNED CERT		server self-signed X.509 public keys for distribution
# 
# CLIENT
# ca.crt			CA ROOT CERT			a certificate authority public key for signing .csr files
# client.key		CLIENT PRIVATE KEY		a private client RSA key to sign and authenticate the public key
# client.crt		CLIENT SIGNED CERT		client self-signed X.509 public keys for distribution

# Certificate Attributes
#
# CN: CommonName:			localhost -> locaalite.com
# OU: OrganizationalUnit	Ca, Server, Client
# O: Organization			Locaalite
# L: Locality				PDA
# S: StateOrProvinceName	GI
# C: CountryName			CT		Two chars!!!


echo "Creating certs folder ..."
mkdir certs_tmp && cd certs_tmp

echo "Generating certificates ..."

# 1. Generate CA's private key and self-signed certificate
# Generating RSA private key, 4096 bit long modulus (2 primes)
openssl genrsa -passout pass:Anem_a_buscar_la_bola_de_drac -des3 -out ca.key 4096
openssl req -passin pass:Anem_a_buscar_la_bola_de_drac -new -x509 -days 3650 -key ca.key -out ca.crt -subj  "/C=CT/ST=GI/L=PDA/O=Locaalite/OU=Ca/CN=localhost"

echo "CA's self-signed certificate"
# Version: 3 (0x2), Signature Algorithm: sha256WithRSAEncryption
# Validity Not Not After : Nov 24 16:59:45 2033 GMT, Public Key Algorithm: rsaEncryption, RSA Public-Key: (4096 bit)
openssl x509 -in ca.crt -noout -text

# 2. Generate web server's private key and certificate signing request (CSR)
# Generating RSA private key, 4096 bit long modulus (2 primes)
openssl genrsa -passout pass:Anem_a_buscar_la_bola_de_drac -des3 -out server.key 4096
openssl req -passin pass:Anem_a_buscar_la_bola_de_drac -new -key server.key -out server.csr -subj  "/C=CT/ST=GI/L=PDA/O=Locaalite/OU=Server/CN=localhost"

# 3. Use CA's private key to sign web server's CSR and get back the signed certificate
# Getting CA Private Key
openssl x509 -req -passin pass:Anem_a_buscar_la_bola_de_drac -days 3650 -in server.csr -CA ca.crt -CAkey ca.key -set_serial 01 -out server.crt

echo "Server's signed certificate"
# Version: 1 (0x0), Signature Algorithm: sha256WithRSAEncryption
#  Validity Not After : Nov 24 17:02:34 2033 GMT, Public Key Algorithm: rsaEncryption, RSA Public-Key: (4096 bit)
openssl x509 -in server.crt -noout -text

# writing RSA key
openssl rsa -passin pass:Anem_a_buscar_la_bola_de_drac -in server.key -out server.key

# 4. Generate client's private key and certificate signing request (CSR)
# Generating RSA private key, 4096 bit long modulus (2 primes)
openssl genrsa -passout pass:Anem_a_buscar_la_bola_de_drac -des3 -out client.key 4096
openssl req -passin pass:Anem_a_buscar_la_bola_de_drac -new -key client.key -out client.csr -subj  "/C=CT/ST=GI/L=PDA/O=Locaalite/OU=Client/CN=localhost"

# 5. Use CA's private key to sign client's CSR and get back the signed certificate
# Getting CA Private Key
openssl x509 -passin pass:Anem_a_buscar_la_bola_de_drac -req -days 3650 -in client.csr -CA ca.crt -CAkey ca.key -set_serial 01 -out client.crt

echo "Client's signed certificate"
# Version: 1 (0x0), Signature Algorithm: sha256WithRSAEncryption
# Validity Not After : Nov 24 17:05:56 2033 GMT, Public Key Algorithm: rsaEncryption, RSA Public-Key: (4096 bit)
openssl x509 -in client.crt -noout -text

# writing RSA key
openssl rsa -passin pass:Anem_a_buscar_la_bola_de_drac -in client.key -out client.key