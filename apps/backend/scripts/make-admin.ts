import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];

  if (!username) {
    console.error('❌ Error: Please provide a username to promote to admin.');
    console.error('Usage: npm run make-admin <username>');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { usernameLowercase: username.toLowerCase() }
  });

  if (!user) {
    console.error(`❌ Error: User with username "${username}" not found in the database.`);
    console.error('Make sure the user has logged into the game at least once to create a profile.');
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`✅ User "${user.username}" is already an admin.`);
    process.exit(0);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin' }
  });

  console.log(`🎉 Success! Promoted "${updatedUser.username}" to admin.`);
  console.log(`You can now log into the admin panel at /space-cargo-runner/admin with this account.`);
}

main()
  .catch((e) => {
    console.error('❌ An unexpected error occurred:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
