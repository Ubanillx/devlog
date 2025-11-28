package tlsutil

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"os"

	"github.com/pavlo-v-chernykh/keystore-go/v4"
)

// LoadTLSCertFromJKS loads a certificate and private key from a JKS file
func LoadTLSCertFromJKS(path, password string) (tls.Certificate, error) {
	f, err := os.Open(path)
	if err != nil {
		return tls.Certificate{}, fmt.Errorf("failed to open keystore: %w", err)
	}
	defer f.Close()

	ks := keystore.New()
	if err := ks.Load(f, []byte(password)); err != nil {
		return tls.Certificate{}, fmt.Errorf("failed to load keystore: %w", err)
	}

	for _, alias := range ks.Aliases() {
		if !ks.IsPrivateKeyEntry(alias) {
			continue
		}

		entry, err := ks.GetPrivateKeyEntry(alias, []byte(password))
		if err != nil {
			continue
		}

		var certs [][]byte
		for _, c := range entry.CertificateChain {
			certs = append(certs, c.Content)
		}

		if len(certs) == 0 {
			continue
		}

		// Parse the PKCS#8 private key
		privKey, err := x509.ParsePKCS8PrivateKey(entry.PrivateKey)
		if err != nil {
			return tls.Certificate{}, fmt.Errorf("failed to parse private key for alias %s: %w", alias, err)
		}

		return tls.Certificate{
			Certificate: certs,
			PrivateKey:  privKey,
		}, nil
	}

	return tls.Certificate{}, fmt.Errorf("no private key found in keystore")
}
