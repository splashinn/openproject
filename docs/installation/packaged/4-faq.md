## Frequently asked questions - FAQ

### How can I install an OpenProject plugin?

Our [official installation page][install-page] has instructions on how to customize your OpenProject installation.
Please note that customization is not yet supported for Docker-based installations.

[install-page]: https://www.openproject.org/download-and-installation/

### How to migrate from Bitnami to the official OpenProject installation packages?

Please follow the following steps:
1. Make a dump of your bitnami MySQL database to export your data. You can refer to the [Bitnami documentation][bitnami-mysql].
1. Make a dump of files your might have uploaded. You can refer to the [Bitnami documentation][bitnami-backup] to perform a full dump.
1. Copy both dumps to the server you want to install OpenProject on.
1. Install OpenProject using the packaged installation.
1. Import the MySQL dump into your new MySQL database. You can get your MySQL configuration by running `sudo openproject config:get DATABASE_URL`
1. Extract the bitnami backup, and copy your file assets into the relevant directory (e.g. in `/var/db/openproject/files` for uploaded files)
1. Restart OpenProject

[bitnami-mysql]: https://docs.bitnami.com/installer/components/mysql/
[bitnami-backup]: https://docs.bitnami.com/installer/apps/openproject/

### Can I use NginX instead of Apache webserver?

Yes, but you will lose the ability to enable Git/SVN repository integration. Note that the OpenProject installer does not support NginX, so you will have to ask to disable the Apache2 integration when running the installer, and then configure NginX yourself so that it forwards traffic to the OpenProject web process (listening by default on 127.0.0.1:6000).

### Can I use PostgreSQL instead of MySQL?

Yes, but you will need to setup the database by yourself, and then ask the installer to use an existing database and enter the host and credentials configuration to access it.

### My favorite linux distribution is not listed. What can I do?

You can either try the manual installation, or ask in the forum whether this could be added to the list of supported distributions.

### What is the better option to run OpenProject in production environments: docker or linux packages?

Linux packages are currently the most stable option, since they are regularly tested and provide an installer to help you configure your OpenProject installation. Docker images do not get the same level of testing.

### How to upgrade my OpenProject installation?

Please refer to the documentation at https://www.openproject.org/operations/upgrading/

### What skills should I have for the installation?

If you use the packaged installation, you should have a basic knowledge of Linux and the command-line terminal.

If you use the docker images, you need to be familiar with Docker and Docker volumes.

### Why don't you support Windows?

Ruby support on Windows is notoriously difficult, however you might be able to run the Docker image, or use the unofficial Windows stack provided by [Bitnami](https://bitnami.com/stack/openproject/installer).

### How to backup and restore my OpenProject instalallation?

Please refer to the documentation at https://www.openproject.org/operations/backup/

### How can I install a free SSL certificate using let's encrypt?

You can get an SSL certificate for free via Let's Encrypt.
Here is how you do it using [certbot](https://github.com/certbot/certbot):

    curl https://dl.eff.org/certbot-auto > /usr/local/bin/certbot-auto
    chmod a+x /usr/local/bin/certbot-auto

    certbot-auto certonly --webroot --webroot-path /opt/openproject/public -d openprojecct.mydomain.com

This requires your OpenProject server to be available from the Internet on port 443 or 80.
If this works the certificate (`cert.pem`) and private key (`privkey.pem`) will be created under `/etc/letsencrypt/live/openproject.mydomain.com/`. Configure these for OpenProject to use by running `openproject reconfigure` and choosing yes when the wizard asks for SSL.

Now this Let's Encryt certificate is only valid for 90 days. To renew it automatically all you have to do is to add the following entry to your crontab (run `crontab -e`):

    0 1 * * * certbot-auto renew --quiet --post-hook "service apache2 restart"

This will execute `certbot renew` every day at 1am. The command checks if the certificate is expired and renews it if that is the case. The web server is restarted in a post hook in order for it to pick up the new certificate.
