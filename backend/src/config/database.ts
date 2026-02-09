import mongoose from 'mongoose';
import logger from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dashboard_conversao';
    
    await mongoose.connect(mongoUri);
    
    logger.info('MongoDB conectado com sucesso', { uri: mongoUri });

    mongoose.connection.on('error', (error) => {
      logger.error('Erro na conexão com MongoDB', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB desconectado');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB desconectado devido ao encerramento da aplicação');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Erro ao conectar ao MongoDB', error);
    process.exit(1);
  }
};
