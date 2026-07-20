import org.mindrot.jbcrypt.BCrypt;
public class TestBcrypt {
    public static void main(String[] args) {
        System.out.println(BCrypt.hashpw("admin", BCrypt.gensalt()));
    }
}
