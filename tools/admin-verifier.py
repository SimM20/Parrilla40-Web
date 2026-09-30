"""Generate only a bcrypt verifier; never save or echo the admin password."""
import getpass
import sys

try:
    import bcrypt
except ImportError:
    sys.exit("Install bcrypt in your operator environment: python -m pip install bcrypt==5.0.0")


def main():
    password = getpass.getpass("Admin password (hidden): ")
    confirmation = getpass.getpass("Repeat password (hidden): ")
    encoded = password.encode("utf-8")
    if not encoded or len(encoded) > 72:
        sys.exit("Use a nonempty password of at most 72 UTF-8 bytes.")
    if password != confirmation:
        sys.exit("Passwords do not match.")
    print(bcrypt.hashpw(encoded, bcrypt.gensalt(rounds=12, prefix=b"2a")).decode("ascii"))


if __name__ == "__main__":
    main()
